<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /** @var \App\Models\User */
    public $user;

    /** @var \App\Models\AccountType */
    public $customerType;

    /** @var \App\Models\AccountType */
    public $cashType;

    /** @var \App\Models\Account */
    public $customer;

    /** @var \App\Models\Account */
    public $cashAccount;

    /** @var \App\Models\Saleman */
    public $salesman;

    /** @var \App\Models\Items */
    public $item;

    /** @var \App\Models\Sales */
    public $sale;
}
