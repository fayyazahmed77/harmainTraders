<?php

namespace App\Http\Controllers\Investor;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Services\ForecastEngine;
use Illuminate\Http\Request;

class ForecastController extends Controller
{
    public function data(Request $request)
    {
        $investor = Investor::where('user_id', $request->user()->id)->firstOrFail();
        $engine = app(ForecastEngine::class);

        return response()->json([
            'projections' => $engine->getProjectedData($investor->id),
            'chart' => $engine->getHistoricalAndProjectedChartData($investor->id),
        ]);
    }
}
