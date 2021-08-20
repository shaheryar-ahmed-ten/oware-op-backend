module.exports.errorHandler = (error,res) => {
    if(error.message === 'Validation error'){
        return error.message = "Name Already Taken!"
    }else {
        return error.message = "Something Went Wrong!"
    }
}