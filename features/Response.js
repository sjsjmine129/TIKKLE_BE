
class Response {
    static create = (success, detail_code, message, data, token) => {
        return{success, detail_code, message, data, token};
    }
}

module.exports = { Response };