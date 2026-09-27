import { StatusCodes } from 'http-status-codes';

export const errorHandler = (err, req, res, next) => {
  let customError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,//500
    msg: err.message || 'Something went wrong try again later',
  };

  if (err?.code === 'ER_DUP_ENTRY') {
    customError.statusCode = StatusCodes.BAD_REQUEST;
    customError.msg = 'Duplicate value entered for a unique field';
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};




// default export



// default export



// named export is used when we want to export multiple functions from a module
// default export is used when we want to export a single function from a module