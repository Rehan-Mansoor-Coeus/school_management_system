<?php

namespace App\Modules\AiAssistant\Tools\Contracts;

use App\Modules\AiAssistant\Services\AiRequestContext;
use App\User;

interface AiTool
{
    public function name();

    public function schema();

    /**
     * @param User|null $user
     * @return bool
     */
    public function allowed($user = null);

    /**
     * @return array
     */
    public function handle(array $args, AiRequestContext $ctx);
}
