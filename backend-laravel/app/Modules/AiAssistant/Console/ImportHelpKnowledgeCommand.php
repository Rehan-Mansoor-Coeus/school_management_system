<?php

namespace App\Modules\AiAssistant\Console;

use App\Modules\AiAssistant\Models\AiKnowledgeArticle;
use App\Modules\AiAssistant\Services\AiKnowledgeService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class ImportHelpKnowledgeCommand extends Command
{
    protected $signature = 'ai:import-help';

    protected $description = 'Import in-app Help and selected manuals into the Okusoma AI knowledge base.';

    public function handle(AiKnowledgeService $knowledge)
    {
        $count = 0;
        $count += $this->importHelpTs($knowledge);
        $count += $this->importManual($knowledge, base_path('../docs/qa/01-USER-GUIDE.md'), 'manual', 'User guide');
        $this->info('Imported or updated '.$count.' knowledge articles.');

        return 0;
    }

    protected function importHelpTs(AiKnowledgeService $knowledge)
    {
        $path = base_path('../frontend-react/src/i18n/help.ts');
        if (! is_file($path)) {
            return 0;
        }
        $source = file_get_contents($path);
        preg_match_all("/(step\d+Title|step\d+Body|step\d+Tip):\s*'((?:\\\\'|[^'])*)'/", $source, $matches, PREG_SET_ORDER);
        $steps = [];
        foreach ($matches as $match) {
            $key = $match[1];
            $value = stripcslashes($match[2]);
            if (preg_match('/step(\d+)(Title|Body|Tip)/', $key, $parts)) {
                $num = $parts[1];
                $field = strtolower($parts[2]);
                if (! isset($steps[$num])) {
                    $steps[$num] = [];
                }
                $steps[$num][$field] = $value;
            }
        }

        $count = 0;
        foreach ($steps as $num => $step) {
            if (empty($step['title']) || empty($step['body'])) {
                continue;
            }
            $content = $step['body'];
            if (! empty($step['tip'])) {
                $content .= "\n\nTip: ".$step['tip'];
            }
            AiKnowledgeArticle::withoutEvents(function () use ($knowledge, $num, $step, $content) {
                $knowledge->upsertArticle([
                    'slug' => 'help-school-admin-step-'.$num,
                    'title' => $step['title'],
                    'category' => 'institution_management',
                    'audience' => 'public',
                    'content' => $content,
                    'keywords' => 'help, school admin, setup, step '.$num,
                    'source_type' => 'help',
                    'source_reference' => $step['title'],
                    'is_public' => true,
                    'is_active' => true,
                    'locale' => 'en',
                ]);
            });
            $count++;
        }

        return $count;
    }

    protected function importManual(AiKnowledgeService $knowledge, $path, $sourceType, $label)
    {
        if (! is_file($path)) {
            return 0;
        }
        $markdown = file_get_contents($path);
        $sections = preg_split('/^##\s+/m', $markdown);
        $count = 0;
        foreach ($sections as $index => $section) {
            $section = trim($section);
            if ($section === '' || $index === 0) {
                continue;
            }
            $lines = preg_split('/\R/', $section);
            $title = trim(array_shift($lines), "# \t");
            $body = trim(implode("\n", $lines));
            if ($title === '' || mb_strlen($body) < 40) {
                continue;
            }
            AiKnowledgeArticle::withoutEvents(function () use ($knowledge, $title, $body, $sourceType, $label) {
                $knowledge->upsertArticle([
                    'slug' => Str::slug($sourceType.'-'.$title),
                    'title' => $title,
                    'category' => 'faq',
                    'audience' => 'public',
                    'content' => mb_substr(strip_tags($body), 0, 4000),
                    'keywords' => $title,
                    'source_type' => $sourceType,
                    'source_reference' => $label.' → '.$title,
                    'is_public' => true,
                    'is_active' => true,
                ]);
            });
            $count++;
        }

        return $count;
    }
}
