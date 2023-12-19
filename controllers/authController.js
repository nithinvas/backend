const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { queryAsync } = require('../database'); // Assuming you have a MySQL connection pool
const { completePayment } = require("./completePayements.js");
const { comparePassword, hashPassword } = require("./../helpers/authHelpers.js");
const uuid = require('uuid');
// Register Controller
const registerController = async (req, res) => {
  try {
    const { name, email, password, dateOfBirth } = req.body;

    // Validations
    if (!name || !email || !password || !dateOfBirth) {
      return res.status(400).send({ message: "Name, email, password, and date of birth are required" });
    }

    // Check if the user already exists
    const existingUser = await queryAsync('SELECT * FROM users WHERE email = ?', [email]);

    if (existingUser.length > 0) {
      return res.status(200).send({
        success: false,
        message: "Email is already registered. Please login.",
      });
    }

    // Validate date format
    const isValidDate = !isNaN(Date.parse(dateOfBirth));
    if (!isValidDate) {
      return res.status(400).send({
        success: false,
        message: "Invalid date format. Please provide a valid date of birth.",
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Insert new user into the database
    const result = await queryAsync('INSERT INTO users (Name, Email, passwordHash, DateOfBirth) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, dateOfBirth]);

    const userId = result.insertId;

    res.status(201).send({
      success: true,
      message: "User registered successfully",
      user: {
        _id: userId,
        name,
        email,   
        dateOfBirth,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in registration",
      error,
    });
  }
};















// Login Controller
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check user
    const [user] = await queryAsync('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registered",
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.PasswordHash);

    if (!isPasswordValid) {
      return res.status(200).send({
        success: false,
        message: "Invalid Password",
      });
    }

    const secretKey = process.env.JWT_SECRET; // Ensure that this variable is set in your environment

    const token = jwt.sign({ _id: user.UserID }, secretKey, {
      expiresIn: '7d',
    });

    res.status(200).send({
      success: true,
      message: "Login successful",
      user: {
        _id: user.UserID,
        name: user.Name,
        email: user.Email,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};





function calculateAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();

  // Check if birthday has occurred this year
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}


const payment = async (req, res) => {
  try {
    // Extract user information and selected batch from the request body
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    }

  // checking age

  const userDOBResult = await queryAsync('SELECT DateOfBirth FROM users WHERE UserID = ?', [userId]);

// Check if userDOBResult is undefined or empty
  if (!userDOBResult || userDOBResult.length === 0 || userDOBResult[0].DateOfBirth === undefined) {
    return res.status(400).json({ success: false, message: 'User date of birth not available' });
  }

  const userDOB = userDOBResult[0].DateOfBirth;
  const userAge = calculateAge(userDOB);

  // Check age restrictions
  if (userAge < 18 || userAge > 65) {
    return res.status(400).json({ success: false, message: 'Age restrictions: Cannot be enrolled. Age must be in between 18 and 65' });
  }

    // Extract selected batch from the request body
    const { batchId } = req.body;
    if (batchId === undefined) {
      return res.status(400).json({ success: false, message: 'Invalid batch information' });
    }
    const [checking_batch] = await queryAsync(
      'SELECT * FROM batch WHERE BatchID = ?',
      [batchId]
    );  
    if(checking_batch==undefined){
      return res.status(400).json({ success: false, message: 'Invalid batch , enter a valid batch' });
    }


    // Check if the user has an existing payment for the current month
    const [existingPayment] = await queryAsync(
      'SELECT * FROM payment WHERE UserID = ? AND DATE_FORMAT(CURDATE(), "%Y-%m") = DATE_FORMAT(DateOfPayment, "%Y-%m")',
      [userId]
    );


    // Calculate the monthly fee
    const monthlyFee = 500;

    if (existingPayment!==undefined) {
      // User is already enrolled for the current month
      const existingBatchId = existingPayment.BatchID;
      return res.status(400).json({ success: false, message: 'User is already enrolled for the current month',batchId: existingBatchId, });
    } 
    else {
      // User doesn't have an existing payment for the current month

      // Check if the user has an existing payment (any month)
      const [existingPayment_expiry] = await queryAsync(
        'SELECT * FROM payment WHERE UserID = ?',
        [userId]
      );

      if (existingPayment_expiry!==undefined) {
        // User has an existing payment but not in the current month
        // Call the completePayment function to simulate payment
        
        const renewPaymentStatus = await completePayment(userId);
        if (!renewPaymentStatus) {
          return res.status(400).json({ success: false, message: 'Payment error' });
        }

        // Update the payment details
        const renewPaymentId = uuid.v4();
        await queryAsync(
          'UPDATE payment SET DateOfPayment = CURDATE(), TimeOfPayment = CURTIME(), Amount = ?, BatchID = ?, PaymentID = ? WHERE UserID = ?',
          [monthlyFee, batchId, renewPaymentId, userId]
        );

        return res.status(200).json({ success: true, message: 'User enrollment renewed and payment successful',batchId:batchId });
      } 
      else {
        // User doesn't have any existing payment
        // Call the completePayment function to simulate payment
        const newPaymentStatus = await completePayment(userId);
        if (!newPaymentStatus) {
          return res.status(400).json({ success: false, message: 'Payment error' });
        }

        // Update the payment details
        const newPaymentId = uuid.v4();

        // Insert the new payment details
        await queryAsync(
          'INSERT INTO payment (UserID, DateOfPayment, TimeOfPayment, Amount, BatchID, PaymentID) VALUES (?, CURDATE(), CURTIME(), ?, ?, ?)',
          [userId, monthlyFee, batchId, newPaymentId]
        );

        return res.status(201).json({ success: true, message: 'User enrolled and payment successful',batchId:batchId });
      }
    }
  } catch (error) {
    console.error('Enrollment and payment error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// get batches 
const getAllBatch = async (req, res) => {
  try {
    
    const rows = await queryAsync('SELECT * FROM batch');
    console.log('rows:',rows);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching batch details:', error);
    res.status(500).json({ error: 'Internal Server Error'});
  }
};




const checkEnrollment = async (req, res) => {
  try {
    // Check if the user has an existing payment for the current month
    const userId = req.user._id;
    const [existingPayment] = await queryAsync(
      'SELECT users.Name AS userName, DATE_FORMAT(DateOfPayment, "%Y-%m") AS paymentMonth, payment.BatchID as batchid ' +
      'FROM payment ' +
      'INNER JOIN users ON payment.UserID = users.UserID ' +
      'WHERE payment.UserID = ? AND DATE_FORMAT(CURDATE(), "%Y-%m") = DATE_FORMAT(DateOfPayment, "%Y-%m")',
      [userId]
    );

    // If the user has an existing payment for the current month, return user name and month of payment
    if (existingPayment !== undefined) {
      const { userName, paymentMonth, batchid } = existingPayment;
      return res.json({ isEnrolled: true, userName, paymentMonth, batchid });
    } else {
      // Check if the user has any existing payment
      const [anyExistingPayment] = await queryAsync(
        'SELECT DATE_FORMAT(MAX(DateOfPayment), "%Y-%m") AS previousPaymentMonth, BatchID ' +
        'FROM payment ' +
        'WHERE UserID = ? ' +
        'GROUP BY BatchID', // Added GROUP BY clause
        [userId]
      );

      if (anyExistingPayment && anyExistingPayment.previousPaymentMonth !== null) {
        const [anyuser] = await queryAsync(
          'SELECT Name as userName ' +
          'FROM users ' +
          'WHERE UserID = ?',
          [userId]
        );
        // User has an existing payment, but not for the current month
        const { previousPaymentMonth, batchid } = anyExistingPayment;
        const { userName } = anyuser;
        return res.json({
          isEnrolled: false,
          message: 'Subscription expired',
          previousPaymentMonth,
          user: anyuser.userName,
          previous_batch: batchid,
        });
      } else {
        // User does not have any existing payment
        return res.json({
          isEnrolled: false,
          message: 'Please subscribe to enroll',
        });
      }
    }
  } catch (error) {
    console.error('Error checking payment:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const userdata = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch user data, enrollment data, and batch details from the database
    const [userData] = await queryAsync('SELECT * FROM users WHERE UserID = ?', [userId]);
    const [enrollmentData] = await queryAsync('SELECT BatchID FROM payment WHERE UserID = ? ORDER BY DateOfPayment DESC LIMIT 1', [userId]);

    if (!userData || !enrollmentData) {
      return res.status(404).json({ success: false, message: 'User not found or not enrolled' });
    }

    const enrolledBatchId = enrollmentData.BatchID;

    // Fetch batch details including start time and end time
    const [batchDetails] = await queryAsync('SELECT * FROM batch WHERE BatchID = ?', [enrolledBatchId]);

    if (!batchDetails) {
      return res.status(404).json({ success: false, message: 'Batch details not found' });
    }

    // Extract the relevant user information, enrolled batch details, start time, and end time
    const { Name, Email, DateOfBirth } = userData;
    const { StartTime, EndTime } = batchDetails;

    // Return the user data, enrolled batch details, start time, and end time in the response
    res.status(200).json({
      success: true,
      user: {
        _id: userId,
        name: Name,
        email: Email,
        dateOfBirth: DateOfBirth,
        enrolledBatchId,
        startTime: StartTime,
        endTime: EndTime,
      },
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


module.exports = {
  registerController,
  loginController,
  payment,
  getAllBatch,
  checkEnrollment,
  userdata,
};







