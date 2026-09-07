<?php

namespace App\Modules\AiAssistant\Services;

use GuzzleHttp\Client;

class OpenAiClient
{
    /** @var Client|null */
    protected $http;

    public function configured()
    {
        return (bool) config('ai.openai.api_key');
    }

    public function chat(array $messages, array $tools = [])
    {
        if (! $this->configured()) {
            return null;
        }

        $payload = [
            'model' => config('ai.openai.model', 'gpt-4o-mini'),
            'messages' => $messages,
            'temperature' => 0.2,
        ];
        if ($tools) {
            $payload['tools'] = $tools;
            $payload['tool_choice'] = 'auto';
        }

        $response = $this->http()->post('chat/completions', ['json' => $payload]);
        $body = json_decode((string) $response->getBody(), true);
        if (! is_array($body)) {
            throw new \RuntimeException('Invalid OpenAI chat response.');
        }

        return $body;
    }

    public function embed(array $texts)
    {
        if (! $this->configured() || ! $texts) {
            return [];
        }

        $response = $this->http()->post('embeddings', [
            'json' => [
                'model' => config('ai.openai.embedding_model', 'text-embedding-3-small'),
                'input' => array_values($texts),
            ],
        ]);
        $body = json_decode((string) $response->getBody(), true);
        $data = isset($body['data']) && is_array($body['data']) ? $body['data'] : [];
        $vectors = [];
        foreach ($data as $row) {
            $vectors[] = isset($row['embedding']) ? $row['embedding'] : [];
        }

        return $vectors;
    }

    protected function http()
    {
        if ($this->http) {
            return $this->http;
        }

        $this->http = new Client([
            'base_uri' => config('ai.openai.base_url', 'https://api.openai.com/v1').'/',
            'timeout' => (int) config('ai.openai.timeout', 45),
            'headers' => [
                'Authorization' => 'Bearer '.config('ai.openai.api_key'),
                'Content-Type' => 'application/json',
            ],
        ]);

        return $this->http;
    }
}
