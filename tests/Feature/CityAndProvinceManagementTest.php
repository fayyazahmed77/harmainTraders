<?php

use App\Models\City;
use App\Models\Country;
use App\Models\Province;
use App\Models\User;
use App\Models\SiteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $role = Role::firstOrCreate(['name' => 'Admin']);
    Permission::firstOrCreate(['name' => 'view cities']);
    Permission::firstOrCreate(['name' => 'edit cities']);
    Permission::firstOrCreate(['name' => 'delete cities']);
    Permission::firstOrCreate(['name' => 'view areas']);
    Permission::firstOrCreate(['name' => 'edit areas']);
    Permission::firstOrCreate(['name' => 'delete areas']);

    $role->givePermissionTo([
        'view cities', 'edit cities', 'delete cities',
        'view areas', 'edit areas', 'delete areas'
    ]);

    $this->admin = User::factory()->create();
    $this->admin->assignRole('Admin');
    $this->actingAs($this->admin);

    SiteSetting::firstOrCreate([], ['two_factor_enabled' => false]);

    // Create test countries
    $this->pk = Country::create(['name' => 'Pakistan', 'code' => 'PK']);
    $this->ae = Country::create(['name' => 'United Arab Emirates', 'code' => 'AE']);

    // Create test provinces
    $this->punjab = Province::create([
        'name' => 'Punjab',
        'code' => 'PB',
        'country_id' => $this->pk->id,
        'latitude' => '31.1704',
        'longitude' => '72.7097',
        'is_active' => true,
        'created_by' => $this->admin->id,
    ]);

    $this->sindh = Province::create([
        'name' => 'Sindh',
        'code' => 'SD',
        'country_id' => $this->pk->id,
        'latitude' => '25.8943',
        'longitude' => '68.5247',
        'is_active' => false,
        'created_by' => $this->admin->id,
    ]);

    $this->dubaiProvince = Province::create([
        'name' => 'Dubai Emirate',
        'code' => 'DXB',
        'country_id' => $this->ae->id,
        'is_active' => true,
        'created_by' => $this->admin->id,
    ]);

    // Create test cities
    $this->lahore = City::create([
        'name' => 'Lahore',
        'code' => 'LHE',
        'country_id' => $this->pk->id,
        'province_id' => $this->punjab->id,
        'latitude' => '31.5204',
        'longitude' => '74.3587',
        'is_active' => true,
        'created_by' => $this->admin->id,
    ]);

    $this->karachi = City::create([
        'name' => 'Karachi',
        'code' => 'KHI',
        'country_id' => $this->pk->id,
        'province_id' => $this->sindh->id,
        'latitude' => '24.8607',
        'longitude' => '67.0011',
        'is_active' => false,
        'created_by' => $this->admin->id,
    ]);

    $this->dubaiCity = City::create([
        'name' => 'Dubai',
        'code' => 'DXB',
        'country_id' => $this->ae->id,
        'province_id' => $this->dubaiProvince->id,
        'is_active' => true,
        'created_by' => $this->admin->id,
    ]);
});

test('it renders cities index with summary metrics and lists all cities', function () {
    $response = $this->get('/cities');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Cities/index')
        ->has('cities', 3)
        ->has('summary', fn (Assert $summary) => $summary
            ->where('total_cities', 3)
            ->where('active_cities', 2)
            ->where('provinces_count', 3)
            ->where('countries_count', 2)
            ->where('mapped_coordinates_count', 2)
        )
        ->has('filters')
    );
});

test('it filters cities by search query', function () {
    $response = $this->get('/cities?search=Lahore');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Cities/index')
        ->has('cities', 1)
        ->where('cities.0.name', 'Lahore')
    );
});

test('it filters cities by country_id', function () {
    $response = $this->get('/cities?country_id=' . $this->ae->id);

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Cities/index')
        ->has('cities', 1)
        ->where('cities.0.name', 'Dubai')
    );
});

test('it filters cities by is_active status', function () {
    $response = $this->get('/cities?is_active=0');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Cities/index')
        ->has('cities', 1)
        ->where('cities.0.name', 'Karachi')
    );
});

test('it creates a new city via store endpoint', function () {
    $response = $this->post('/cities', [
        'name' => 'Islamabad',
        'code' => 'ISB',
        'country_id' => $this->pk->id,
        'province_id' => $this->punjab->id,
        'latitude' => '33.6844',
        'longitude' => '73.0479',
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('cities', [
        'name' => 'Islamabad',
        'code' => 'ISB',
        'country_id' => $this->pk->id,
        'province_id' => $this->punjab->id,
    ]);
});

test('it renders provinces index with summary metrics and cities count', function () {
    $response = $this->get('/provinces');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Provinces/index')
        ->has('provinces', 3)
        ->has('summary', fn (Assert $summary) => $summary
            ->where('total_provinces', 3)
            ->where('active_provinces', 2)
            ->where('total_cities_count', 3)
            ->where('countries_count', 2)
            ->where('mapped_coordinates_count', 2)
        )
        ->has('filters')
    );
});

test('it filters provinces by search query', function () {
    $response = $this->get('/provinces?search=Punjab');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Provinces/index')
        ->has('provinces', 1)
        ->where('provinces.0.name', 'Punjab')
    );
});

test('it filters provinces by country_id', function () {
    $response = $this->get('/provinces?country_id=' . $this->ae->id);

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Provinces/index')
        ->has('provinces', 1)
        ->where('provinces.0.name', 'Dubai Emirate')
    );
});

test('it filters provinces by is_active status', function () {
    $response = $this->get('/provinces?is_active=0');

    $response->assertStatus(200);
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Provinces/index')
        ->has('provinces', 1)
        ->where('provinces.0.name', 'Sindh')
    );
});

test('it creates a new province via store endpoint', function () {
    $response = $this->post('/provinces', [
        'name' => 'Khyber Pakhtunkhwa',
        'code' => 'KP',
        'country_id' => $this->pk->id,
        'latitude' => '34.0151',
        'longitude' => '71.5249',
        'is_active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('provinces', [
        'name' => 'Khyber Pakhtunkhwa',
        'code' => 'KP',
        'country_id' => $this->pk->id,
    ]);
});
