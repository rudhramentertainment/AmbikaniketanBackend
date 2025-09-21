import {body} from "express-validator";

const donateValidator = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be > 0'),
  body('donorEmail').optional().isEmail().withMessage('Invalid email'),
  body('donorPhone').optional().isMobilePhone('any').withMessage('Invalid phoneno')
];


export default donateValidator;