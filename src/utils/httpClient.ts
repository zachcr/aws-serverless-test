import axios, { AxiosError, AxiosInstance, AxiosResponse, Method } from 'axios'
import { Agent } from 'https'
import axiosRetry from 'axios-retry'
import { AxiosRequestConfig } from '../../node_modules/axios/index.d';
import { HttpException } from './httpException'
import HttpResponse from './httpResponse';
import { AuthParam, Header } from '../';


/**
 * HTTP Methods Allowed
 * */
enum HttpMethod {
    Get = 'get',
    Post = 'post',
    Put = 'put',
    Delete = 'delete'
}

/**
 * @class Base Http Client
 */
export class HttpClient {
    /** underlying HTTP client used to make requests */
    protected client: AxiosInstance

    /**
     * Instantiate a client for interacting with the API at `baseURL`, sending
     * `apiKey` in its `Authorization` header.
     *
     * @param baseUrl the base URL of the API, inclduing URL scheme
     * @param apiKey an API key to be included in the `Authorization` header
     * @param timeout how long the client should wait before timing out a
     *        request, defaults to a 2 second. As per the Braze API, this should be 2 second as fail safe
     */
    public constructor(baseUrl: string, auth?: AuthParam, header: Header = {}, timeout = 2000) {
        const axiosOptions: AxiosRequestConfig = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...header,
            },
            timeout: timeout,
            maxRedirects: 10,
            httpsAgent: new Agent({
                rejectUnauthorized: Boolean(process.env.ALLOWS_INSECURE_SSL_CERTIFICATES) ?? true
            }),
            baseURL: baseUrl
        }
        if (auth) {
            axiosOptions.auth = auth
        }
        this.client = axios.create(axiosOptions)
        axiosRetry(this.client, { retries: 3 }) // it retries if it is a network error or a 5xx error on an idempotent request (GET, HEAD, OPTIONS, PUT or DELETE).
    }

    /**
     * Handles http response
     * @param response
     * @returns
     */
    private handleResponse<ResponseData>(response: AxiosResponse): HttpResponse<ResponseData> {
        if (response.status === 200 || response.status === 201) {
            return new HttpResponse<ResponseData>(response.status, response.data)
        }
        throw new HttpException(response.data, response.status)
    }

    /**
     * Sends http client
     * @param method
     * @param url
     * @param params
     * @param data
     * @returns
     * @throws HttpException
     */
    private async send<ResponseData>(
        method: Method,
        url: string,
        params: Record<string, unknown>,
        data: Record<string, unknown> | null
    ): Promise<HttpResponse<ResponseData>> {
        try {
            const response = await this.client.request({ url, method, params, data })
            // console.debug(`HttpResponse for url: ${url}`, response)
            return this.handleResponse<ResponseData>(response)
        } catch (e: unknown) {
            const error = e as AxiosError
            console.error(`An Unexpected AxiosError Occurred while making braze request ${method}`, error)
            throw new HttpException(error.message, Number(error.code))
        }
    }

    /**
     * Gets http client
     * @private
     * @param url
     * @param [params]
     * @returns
     */
    public async get<ResponseData>(
        url: string,
        params: Record<string, unknown> = {}
    ): Promise<HttpResponse<ResponseData>> {
        return this.send<ResponseData>(HttpMethod.Get, url, params, null)
    }

    /**
     * Posts http client
     * @private
     * @param url
     * @param [data]
     * @param [params]
     * @returns
     */
    public async post<ResponseData>(
        url: string,
        data: Record<string, unknown> = {},
        params = {}
    ): Promise<HttpResponse<ResponseData>> {
        return this.send<ResponseData>(HttpMethod.Post, url, params, data)
    }
}