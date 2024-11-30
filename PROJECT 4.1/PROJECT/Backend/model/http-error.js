//  creating my own error handling class

class HttpError extends Error{
    constructor(message,errorCode){
        super(message);
        this.code = errorCode;
    }
}
// to import the class in another module we need to export
module.exports = HttpError;