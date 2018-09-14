<?php

namespace App\Http\Controllers;

use App\Panel;
use App\County;
use App\PanelData;
use App\CarbonPrice;
use Illuminate\Http\Request;
use App\Events\EnergyUpdated;

class PanelController extends Controller
{
    public function receivePanelData(Request $request)
    {
      	// Create a panel data entry
		$panelData = PanelData::create($request->all());
        broadcast(new MessageSent($panelData))->toOthers();

		// Update location information for the user if latitude and longitude have been availed
		if($request->has('latitude') && $request->has('longitude')){
			$county = County::where('name',$this->getCounty(['latitude'=>$request->latitude, 'longitude'=>$request->longitude]))->first();
			// Update panel data according to data provided
			Panel::findOrFail($request->panel_id)->user->location()->update(array_merge($request->all(), [
				'county_id' => $county ? $county->id : 0
			]));
		}
    }

    public function marketPricing(Request $request)
    {
    	// Get the current prices and rate
    	$market = CarbonPrice::where('active', 1)->first();

    	// Return current prices in the market 
    	return response([
    		'price' => $market->value,
    		'rate' => $market->credit_rate,
    	], 200);  	
    }

    public function createMarketPrice(Request $request)
    {
    	// Get the current price
        $market = CarbonPrice::where('active', 1)->first();

        // Check if the market prices have changed
        if(($market->credit_rate == $request->rate) && ($market->value == $request->price)){
            return response([
                'state' => 'error',
                'message'=>'You have updated the market prices with the same values.', 
                'data' => $market,
            ], 400);             
        }

        // Update the status of the current price
        $market->update([
            'active' => 0
        ]);
        // Create a new price
        $market = CarbonPrice::create([
            'credit_rate' => $request->rate,
            'value' => $request->price,
        ]);

    	// Create a new carbon price instance
    	return response([
    		'state' => 'success',
            'message'=>'The market rate has been updated successfully.', 
            'data' => $market,
    	], 200); 
    }
}