exports.success = function (req,res,_message,status) {
	const statusCode = status || 200;
	const message = _message || '';
	res.status(statusCode).send({
		error:false,
		status: statusCode,
		body: message
	});
}

exports.error = function (req,res,_message,status) {
	const statusCode = status || 500;
	const message = _message || 'Error no controlado';
	res.status(statusCode).send({
		error:true,
		status: statusCode,
		body: message
	});
}