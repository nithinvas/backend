<strong><strong><strong>Screenshots of the deployed </strong></strong></strong>
![Screenshot (540)](https://github.com/nithinvas/backend/assets/40798917/787490ec-3d56-4d2d-a651-50aff811df2a)
![Screenshot (541)](https://github.com/nithinvas/backend/assets/40798917/884f0d36-4530-4e12-a883-b3c5d2269070)
![Screenshot (545)](https://github.com/nithinvas/backend/assets/40798917/52434704-4a6a-4fbb-b40f-90b113013374)

![Screenshot (543)](https://github.com/nithinvas/backend/assets/40798917/ffa0f688-f9bc-4146-b1fb-b2adba9aa46d)

![Screenshot (544)](https://github.com/nithinvas/backend/assets/40798917/386e8d04-d7c7-4127-9be3-9086e4ee6eab)




<Bold><strong><strong>My database ER diagram</strong></strong></Bold>


![er_my](https://github.com/nithinvas/backend/assets/40798917/7677e566-5195-4aea-801e-07a6dd4c9df6)



<strong><strong>Tech stack used: Reactjs, Node js, Mysql</strong></strong><br>
Hosted in Vercel cloud (both frontend and backend)<br>

Backend is Deployed at: https://backend-psi-jet.vercel.app/ <br>
Website link-frontend:https://frontend-pi-six-99.vercel.app/ <br>

Github link- frontend:https://github.com/nithinvas/frontend <br>

For Backend Api's please check published postman Api documentation: <br>
https://documenter.getpostman.com/view/17328570/2s9YkoeMPd

<strong><strong>This is the flow of the web application</strong></strong>


<img width="356" alt="system_flow" src="https://github.com/nithinvas/backend/assets/40798917/477ff2b5-cea2-4683-b7ae-db87d15df9ee">

<strong><strong><strong>API EndPoints</strong></strong></strong> <br> 
router.post('/login', authController.loginController);<br> 
router.post('/register', authController.registerController);<br> 
router.post('/payment',authMiddleware.requireSignIn,authController.payment);<br> 
router.get('/getAllBatches',authController.getAllBatch);<br> 
router.get('/checkEnrollment',authMiddleware.requireSignIn,authController.checkEnrollment);<br> 
router.get('/getuserdata',authMiddleware.requireSignIn,authController.userdata);<br> 

<strong><strong><strong>Functionalities</strong></strong></strong> <br> 
1)payment is done using completePayment function in completePayment.js <br> 
2)Age restriction is set and it validates during payment  <br> 
3)flexibilty of database is available <br> 
4)Jwt Authentication is used and middlewares are written to check the authenticity of the user  <br> 


