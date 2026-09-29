<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'user_id','type','token_hash','expires_at','used_at'
])]
class AttendanceQrToken extends Model
{
    use HasUuids;

    public $incrementing = false;
    protected $keyType = 'string';

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }
}
