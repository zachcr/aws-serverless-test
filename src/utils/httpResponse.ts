export default class HttpResponse<ResponseData> {
    public statusCode: number
    public data?: ResponseData

    public constructor(statusCode: number, data?: ResponseData) {
        this.statusCode = statusCode
        this.data = data
    }
}