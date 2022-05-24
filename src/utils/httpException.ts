export class HttpException extends Error {
    public message: string
    public statusCode: number

    public constructor(message: string, statusCode: number) {
        super(message)
        this.message = message
        this.statusCode = statusCode
    }
}