const AWS = require("aws-sdk");

exports.getSSMParameter = async (input) => {
	// Create an SSM client
	//console.log("input : ", input);

	const ssm = new AWS.SSM();

	try {
		// Get the parameter value
		const response = await ssm
			.getParameter({ Name: input, WithDecryption: true })
			.promise();

		// Access the parameter value from the response
		const parameterValue = response.Parameter.Value;

		return parameterValue;
	} catch {
		return null;
	}
};
