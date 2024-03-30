class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something ent wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
  }

  //   will se in future

  //   if(stack){
  //     this.stack=stack;
  //   }
  //   else{
  //     Error.captureStackTrace(this,this.constructor)
  //   }
}

export default ApiError;