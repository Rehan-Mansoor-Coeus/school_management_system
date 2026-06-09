<?php

namespace App\Support;

class HttpResponse
{
    protected $status;

    protected $body;

    public function __construct(int $status, string $body)
    {
        $this->status = $status;
        $this->body = $body;
    }

    public function successful(): bool
    {
        return $this->status >= 200 && $this->status < 300;
    }

    public function status(): int
    {
        return $this->status;
    }

    public function body(): string
    {
        return $this->body;
    }

    public function json(): ?array
    {
        $decoded = json_decode($this->body, true);

        return is_array($decoded) ? $decoded : null;
    }
}

class HttpClient
{
    public static function get(string $url, array $headers = []): HttpResponse
    {
        return self::request('GET', $url, null, $headers);
    }

    public static function postJson(string $url, array $data, array $headers = []): HttpResponse
    {
        $headers = array_merge(['Content-Type' => 'application/json', 'Accept' => 'application/json'], $headers);

        return self::request('POST', $url, json_encode($data), $headers);
    }

    public static function postForm(string $url, array $data, array $headers = []): HttpResponse
    {
        $headers = array_merge(['Content-Type' => 'application/x-www-form-urlencoded'], $headers);

        return self::request('POST', $url, http_build_query($data), $headers);
    }

    public static function withToken(string $token): AuthenticatedHttpClient
    {
        return new AuthenticatedHttpClient($token);
    }

    protected static function request(string $method, string $url, ?string $body, array $headers): HttpResponse
    {
        $ch = curl_init($url);
        $headerLines = [];

        foreach ($headers as $key => $value) {
            $headerLines[] = $key.': '.$value;
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headerLines,
            CURLOPT_TIMEOUT => 30,
        ]);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }

        $responseBody = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($responseBody === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new \RuntimeException('HTTP request failed: '.$error);
        }

        curl_close($ch);

        return new HttpResponse($status, $responseBody);
    }
}

class AuthenticatedHttpClient
{
    protected $token;

    public function __construct(string $token)
    {
        $this->token = $token;
    }

    public function get(string $url, array $headers = []): HttpResponse
    {
        return HttpClient::get($url, $this->authHeaders($headers));
    }

    public function post(string $url, array $data, array $headers = []): HttpResponse
    {
        return HttpClient::postJson($url, $data, $this->authHeaders($headers));
    }

    protected function authHeaders(array $headers = []): array
    {
        $headers['Authorization'] = 'Bearer '.$this->token;

        return $headers;
    }
}
