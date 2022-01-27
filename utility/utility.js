const { default: axios } = require("axios");

exports.handleHookError = (error, message = "") => {
    const hook = `${process.env.INWARD_ERROR_HOOK}`;
    const slackBody = {
        text: "Inward After Update",
        attachments: [
            {
                color: "good",
                text: `${message} MODEL : ${error.message}`
            }
        ]
    }
    return axios.post(`https://hooks.slack.com/services/${hook}`, slackBody)
}