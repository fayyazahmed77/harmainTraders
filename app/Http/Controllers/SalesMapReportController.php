<?php

namespace App\Http\Controllers;

use App\Models\Sales;
use App\Models\Province;
use App\Models\City;
use App\Models\Areas;
use App\Models\Subarea;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SalesMapReportController extends Controller
{
    public function index()
    {
        return Inertia::render('reports/sales-map/index', [
            'provinces' => Province::select('id', 'name', 'latitude', 'longitude')->get(),
            'cities' => City::select('id', 'name', 'latitude', 'longitude', 'province_id')->get(),
        ]);
    }

    public function getData(Request $request)
    {
        $level = $request->input('level', 'country'); // country, province, city, area, subarea

        $query = DB::table('sales')
            ->join('accounts', 'sales.customer_id', '=', 'accounts.id')
            ->select(DB::raw('count(sales.id) as sales_count'), DB::raw('sum(sales.net_total) as total_amount'));

        if ($level === 'country' || $level === 'province') {
            $query->join('provinces', 'accounts.province_id', '=', 'provinces.id')
                ->addSelect('provinces.id', 'provinces.name', 'provinces.latitude', 'provinces.longitude')
                ->groupBy('provinces.id', 'provinces.name', 'provinces.latitude', 'provinces.longitude');
        } elseif ($level === 'city') {
            $query->join('cities', 'accounts.city_id', '=', 'cities.id')
                ->addSelect('cities.id', 'cities.name', 'cities.latitude', 'cities.longitude', 'cities.province_id')
                ->groupBy('cities.id', 'cities.name', 'cities.latitude', 'cities.longitude', 'cities.province_id');
        } elseif ($level === 'area') {
            $query->join('areas', 'accounts.area_id', '=', 'areas.id')
                ->addSelect('areas.id', 'areas.name', 'areas.latitude', 'areas.longitude', 'areas.city_id')
                ->groupBy('areas.id', 'areas.name', 'areas.latitude', 'areas.longitude', 'areas.city_id');
        } elseif ($level === 'subarea') {
            $query->join('subareas', 'accounts.subarea_id', '=', 'subareas.id')
                ->addSelect('subareas.id', 'subareas.name', 'subareas.latitude', 'subareas.longitude', 'subareas.area_id')
                ->groupBy('subareas.id', 'subareas.name', 'subareas.latitude', 'subareas.longitude', 'subareas.area_id');
        }

        return response()->json($query->get());
    }
}
