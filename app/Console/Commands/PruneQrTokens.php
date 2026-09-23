<?php

namespace App\Console\Commands;

use App\Repositories\Contracts\QrLoginTokenRepositoryInterface;
use Illuminate\Console\Command;

class PruneQrTokens extends Command
{
    protected $signature = 'qr:prune';

    protected $description = 'Elimina los tokens QR de login caducados';

    public function handle(QrLoginTokenRepositoryInterface $tokens): int
    {
        $this->info(sprintf('%d token(s) eliminado(s).', $tokens->prune()));

        return self::SUCCESS;
    }
}
