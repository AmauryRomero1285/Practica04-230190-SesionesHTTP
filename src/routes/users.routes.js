import {Router} from 'express';
import userController from '../controller/users.controller.js';

const userRouter=Router();
userRouter.post('/register',userController.insert);
userRouter.put('/update/:sessionID',userController.update);
userRouter.get('/showUsers',userController.showUsers);
export default userRouter;