const { default: axios } = require("axios");

exports.handleHookError = (error, message = "") => {
    const hook = `${process.env.ERROR_HOOK}`;
    const slackBody = {
        text: "Hooks Alert",
        attachments: [
            {
                color: "good",
                text: `${message} MODEL : ${error.message}`
            }
        ]
    }
    return axios.post(`https://hooks.slack.com/services/${hook}`, slackBody)
}