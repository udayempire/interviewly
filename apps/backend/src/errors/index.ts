export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ){
        super(message);
        this.name = this.constructor.name;
    }
};

export class BadRequestError extends AppError {
    constructor (message:string){
        super(message,409)
    }
};

export class ResumeParseError extends AppError {
    constructor (message:string){
        super(message,422)
    }
};