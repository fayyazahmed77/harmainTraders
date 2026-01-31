<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ItemsSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $items = [
            // Beverages Category
            ['code' => 'BEV001', 'title' => 'Coca Cola 1.5L', 'short_name' => 'Coke 1.5L', 'company' => 'Coca Cola', 'category' => 'Beverages', 'trade_price' => 85.00, 'retail' => 100.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 240, 'stock_2' => 0, 'pt2' => 87.00, 'pt3' => 89.00, 'pt4' => 91.00, 'pt5' => 93.00, 'pt6' => 95.00, 'pt7' => 97.00],
            ['code' => 'BEV002', 'title' => 'Pepsi 1.5L', 'short_name' => 'Pepsi 1.5L', 'company' => 'PepsiCo', 'category' => 'Beverages', 'trade_price' => 83.00, 'retail' => 98.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 180, 'stock_2' => 6, 'pt2' => 85.00, 'pt3' => 87.00, 'pt4' => 89.00, 'pt5' => 91.00, 'pt6' => 93.00, 'pt7' => 95.00],
            ['code' => 'BEV003', 'title' => 'Sprite 1L', 'short_name' => 'Sprite 1L', 'company' => 'Coca Cola', 'category' => 'Beverages', 'trade_price' => 65.00, 'retail' => 80.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 144, 'stock_2' => 0, 'pt2' => 67.00, 'pt3' => 69.00, 'pt4' => 71.00, 'pt5' => 73.00, 'pt6' => 75.00, 'pt7' => 77.00],
            ['code' => 'BEV004', 'title' => 'Fanta Orange 500ml', 'short_name' => 'Fanta 500ml', 'company' => 'Coca Cola', 'category' => 'Beverages', 'trade_price' => 45.00, 'retail' => 60.00, 'packing_qty' => 24, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 288, 'stock_2' => 12, 'pt2' => 47.00, 'pt3' => 49.00, 'pt4' => 51.00, 'pt5' => 53.00, 'pt6' => 55.00, 'pt7' => 57.00],
            ['code' => 'BEV005', 'title' => 'Mountain Dew 1.5L', 'short_name' => 'Dew 1.5L', 'company' => 'PepsiCo', 'category' => 'Beverages', 'trade_price' => 84.00, 'retail' => 99.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 120, 'stock_2' => 0, 'pt2' => 86.00, 'pt3' => 88.00, 'pt4' => 90.00, 'pt5' => 92.00, 'pt6' => 94.00, 'pt7' => 96.00],

            // Snacks Category
            ['code' => 'SNK001', 'title' => 'Lays Classic 60g', 'short_name' => 'Lays 60g', 'company' => 'PepsiCo', 'category' => 'Snacks', 'trade_price' => 35.00, 'retail' => 50.00, 'packing_qty' => 24, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 480, 'stock_2' => 0, 'pt2' => 37.00, 'pt3' => 39.00, 'pt4' => 41.00, 'pt5' => 43.00, 'pt6' => 45.00, 'pt7' => 47.00],
            ['code' => 'SNK002', 'title' => 'Kurkure Masala 62g', 'short_name' => 'Kurkure 62g', 'company' => 'PepsiCo', 'category' => 'Snacks', 'trade_price' => 32.00, 'retail' => 45.00, 'packing_qty' => 24, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 360, 'stock_2' => 12, 'pt2' => 34.00, 'pt3' => 36.00, 'pt4' => 38.00, 'pt5' => 40.00, 'pt6' => 42.00, 'pt7' => 44.00],
            ['code' => 'SNK003', 'title' => 'Cheetos Crunchy 90g', 'short_name' => 'Cheetos 90g', 'company' => 'PepsiCo', 'category' => 'Snacks', 'trade_price' => 48.00, 'retail' => 65.00, 'packing_qty' => 18, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 216, 'stock_2' => 6, 'pt2' => 50.00, 'pt3' => 52.00, 'pt4' => 54.00, 'pt5' => 56.00, 'pt6' => 58.00, 'pt7' => 60.00],
            ['code' => 'SNK004', 'title' => 'Pringles Original 107g', 'short_name' => 'Pringles 107g', 'company' => 'Kelloggs', 'category' => 'Snacks', 'trade_price' => 180.00, 'retail' => 220.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 96, 'stock_2' => 0, 'pt2' => 185.00, 'pt3' => 190.00, 'pt4' => 195.00, 'pt5' => 200.00, 'pt6' => 205.00, 'pt7' => 210.00],

            // Dairy Products
            ['code' => 'DRY001', 'title' => 'Nestle Milk Pack 1L', 'short_name' => 'Nestle Milk 1L', 'company' => 'Nestle', 'category' => 'Dairy', 'trade_price' => 220.00, 'retail' => 250.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 144, 'stock_2' => 0, 'pt2' => 225.00, 'pt3' => 230.00, 'pt4' => 235.00, 'pt5' => 240.00, 'pt6' => 243.00, 'pt7' => 246.00],
            ['code' => 'DRY002', 'title' => 'Olpers Milk 1L', 'short_name' => 'Olpers 1L', 'company' => 'Engro Foods', 'category' => 'Dairy', 'trade_price' => 215.00, 'retail' => 245.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 120, 'stock_2' => 6, 'pt2' => 220.00, 'pt3' => 225.00, 'pt4' => 230.00, 'pt5' => 235.00, 'pt6' => 238.00, 'pt7' => 241.00],
            ['code' => 'DRY003', 'title' => 'Tarang Yogurt 400g', 'short_name' => 'Tarang 400g', 'company' => 'Nestle', 'category' => 'Dairy', 'trade_price' => 95.00, 'retail' => 120.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 180, 'stock_2' => 0, 'pt2' => 98.00, 'pt3' => 101.00, 'pt4' => 104.00, 'pt5' => 107.00, 'pt6' => 110.00, 'pt7' => 113.00],
            ['code' => 'DRY004', 'title' => 'Dairy Omung Butter 200g', 'short_name' => 'Butter 200g', 'company' => 'Dairy Omung', 'category' => 'Dairy', 'trade_price' => 380.00, 'retail' => 450.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 72, 'stock_2' => 0, 'pt2' => 390.00, 'pt3' => 400.00, 'pt4' => 410.00, 'pt5' => 420.00, 'pt6' => 430.00, 'pt7' => 440.00],

            // Biscuits
            ['code' => 'BIS001', 'title' => 'Oreo Original 120g', 'short_name' => 'Oreo 120g', 'company' => 'Mondelez', 'category' => 'Biscuits', 'trade_price' => 85.00, 'retail' => 110.00, 'packing_qty' => 24, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 288, 'stock_2' => 0, 'pt2' => 88.00, 'pt3' => 91.00, 'pt4' => 94.00, 'pt5' => 97.00, 'pt6' => 100.00, 'pt7' => 103.00],
            ['code' => 'BIS002', 'title' => 'Peek Freans Sooper 96g', 'short_name' => 'Sooper 96g', 'company' => 'EBM', 'category' => 'Biscuits', 'trade_price' => 42.00, 'retail' => 60.00, 'packing_qty' => 24, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 480, 'stock_2' => 12, 'pt2' => 44.00, 'pt3' => 46.00, 'pt4' => 48.00, 'pt5' => 50.00, 'pt6' => 52.00, 'pt7' => 54.00],
            ['code' => 'BIS003', 'title' => 'Britannia Marie 120g', 'short_name' => 'Marie 120g', 'company' => 'Britannia', 'category' => 'Biscuits', 'trade_price' => 38.00, 'retail' => 55.00, 'packing_qty' => 24, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 360, 'stock_2' => 0, 'pt2' => 40.00, 'pt3' => 42.00, 'pt4' => 44.00, 'pt5' => 46.00, 'pt6' => 48.00, 'pt7' => 50.00],
            ['code' => 'BIS004', 'title' => 'Cocomo Chocolate 96g', 'short_name' => 'Cocomo 96g', 'company' => 'EBM', 'category' => 'Biscuits', 'trade_price' => 48.00, 'retail' => 65.00, 'packing_qty' => 24, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 432, 'stock_2' => 0, 'pt2' => 50.00, 'pt3' => 52.00, 'pt4' => 54.00, 'pt5' => 56.00, 'pt6' => 58.00, 'pt7' => 60.00],

            // Confectionery
            ['code' => 'CNF001', 'title' => 'Cadbury Dairy Milk 65g', 'short_name' => 'DM 65g', 'company' => 'Mondelez', 'category' => 'Confectionery', 'trade_price' => 180.00, 'retail' => 220.00, 'packing_qty' => 18, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 216, 'stock_2' => 0, 'pt2' => 185.00, 'pt3' => 190.00, 'pt4' => 195.00, 'pt5' => 200.00, 'pt6' => 205.00, 'pt7' => 210.00],
            ['code' => 'CNF002', 'title' => 'Kit Kat 4 Finger 41.5g', 'short_name' => 'KitKat 41g', 'company' => 'Nestle', 'category' => 'Confectionery', 'trade_price' => 95.00, 'retail' => 120.00, 'packing_qty' => 24, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 288, 'stock_2' => 0, 'pt2' => 98.00, 'pt3' => 101.00, 'pt4' => 104.00, 'pt5' => 107.00, 'pt6' => 110.00, 'pt7' => 113.00],
            ['code' => 'CNF003', 'title' => 'Snickers 50g', 'short_name' => 'Snickers 50g', 'company' => 'Mars', 'category' => 'Confectionery', 'trade_price' => 88.00, 'retail' => 110.00, 'packing_qty' => 24, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 192, 'stock_2' => 12, 'pt2' => 91.00, 'pt3' => 94.00, 'pt4' => 97.00, 'pt5' => 100.00, 'pt6' => 103.00, 'pt7' => 106.00],
            ['code' => 'CNF004', 'title' => 'Bounty 57g', 'short_name' => 'Bounty 57g', 'company' => 'Mars', 'category' => 'Confectionery', 'trade_price' => 92.00, 'retail' => 115.00, 'packing_qty' => 24, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 168, 'stock_2' => 0, 'pt2' => 95.00, 'pt3' => 98.00, 'pt4' => 101.00, 'pt5' => 104.00, 'pt6' => 107.00, 'pt7' => 110.00],

            // Personal Care
            ['code' => 'PER001', 'title' => 'Lux Soap 120g', 'short_name' => 'Lux 120g', 'company' => 'Unilever', 'category' => 'Personal Care', 'trade_price' => 65.00, 'retail' => 85.00, 'packing_qty' => 48, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 576, 'stock_2' => 0, 'pt2' => 68.00, 'pt3' => 71.00, 'pt4' => 74.00, 'pt5' => 77.00, 'pt6' => 80.00, 'pt7' => 83.00],
            ['code' => 'PER002', 'title' => 'Lifebuoy Soap 120g', 'short_name' => 'Lifebuoy 120g', 'company' => 'Unilever', 'category' => 'Personal Care', 'trade_price' => 58.00, 'retail' => 75.00, 'packing_qty' => 48, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 480, 'stock_2' => 24, 'pt2' => 61.00, 'pt3' => 64.00, 'pt4' => 67.00, 'pt5' => 70.00, 'pt6' => 72.00, 'pt7' => 74.00],
            ['code' => 'PER003', 'title' => 'Colgate Toothpaste 150g', 'short_name' => 'Colgate 150g', 'company' => 'Colgate', 'category' => 'Personal Care', 'trade_price' => 185.00, 'retail' => 230.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 144, 'stock_2' => 0, 'pt2' => 190.00, 'pt3' => 195.00, 'pt4' => 200.00, 'pt5' => 205.00, 'pt6' => 210.00, 'pt7' => 215.00],
            ['code' => 'PER004', 'title' => 'Head & Shoulders 180ml', 'short_name' => 'H&S 180ml', 'company' => 'P&G', 'category' => 'Personal Care', 'trade_price' => 420.00, 'retail' => 520.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 96, 'stock_2' => 0, 'pt2' => 430.00, 'pt3' => 440.00, 'pt4' => 450.00, 'pt5' => 460.00, 'pt6' => 470.00, 'pt7' => 480.00],

            // Detergents
            ['code' => 'DET001', 'title' => 'Surf Excel 1kg', 'short_name' => 'Surf 1kg', 'company' => 'Unilever', 'category' => 'Detergents', 'trade_price' => 380.00, 'retail' => 450.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 120, 'stock_2' => 0, 'pt2' => 390.00, 'pt3' => 400.00, 'pt4' => 410.00, 'pt5' => 420.00, 'pt6' => 430.00, 'pt7' => 440.00],
            ['code' => 'DET002', 'title' => 'Ariel Powder 1kg', 'short_name' => 'Ariel 1kg', 'company' => 'P&G', 'category' => 'Detergents', 'trade_price' => 395.00, 'retail' => 470.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 108, 'stock_2' => 0, 'pt2' => 405.00, 'pt3' => 415.00, 'pt4' => 425.00, 'pt5' => 435.00, 'pt6' => 445.00, 'pt7' => 455.00],
            ['code' => 'DET003', 'title' => 'Bonus Detergent 800g', 'short_name' => 'Bonus 800g', 'company' => 'Colgate', 'category' => 'Detergents', 'trade_price' => 180.00, 'retail' => 230.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 144, 'stock_2' => 6, 'pt2' => 185.00, 'pt3' => 190.00, 'pt4' => 195.00, 'pt5' => 200.00, 'pt6' => 205.00, 'pt7' => 210.00],

            // Cooking Oil
            ['code' => 'OIL001', 'title' => 'Dalda Cooking Oil 1L', 'short_name' => 'Dalda 1L', 'company' => 'Dalda Foods', 'category' => 'Cooking Oil', 'trade_price' => 420.00, 'retail' => 480.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 144, 'stock_2' => 0, 'pt2' => 430.00, 'pt3' => 440.00, 'pt4' => 450.00, 'pt5' => 460.00, 'pt6' => 470.00, 'pt7' => 475.00],
            ['code' => 'OIL002', 'title' => 'Habib Oil 1L', 'short_name' => 'Habib 1L', 'company' => 'Habib Oil', 'category' => 'Cooking Oil', 'trade_price' => 410.00, 'retail' => 470.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 120, 'stock_2' => 0, 'pt2' => 420.00, 'pt3' => 430.00, 'pt4' => 440.00, 'pt5' => 450.00, 'pt6' => 460.00, 'pt7' => 465.00],
            ['code' => 'OIL003', 'title' => 'Kisan Canola Oil 1L', 'short_name' => 'Kisan 1L', 'company' => 'Kisan', 'category' => 'Cooking Oil', 'trade_price' => 450.00, 'retail' => 520.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 96, 'stock_2' => 6, 'pt2' => 460.00, 'pt3' => 470.00, 'pt4' => 480.00, 'pt5' => 490.00, 'pt6' => 500.00, 'pt7' => 510.00],

            // Rice
            ['code' => 'RIC001', 'title' => 'Basmati Rice 5kg', 'short_name' => 'Basmati 5kg', 'company' => 'Guard', 'category' => 'Rice', 'trade_price' => 1250.00, 'retail' => 1450.00, 'packing_qty' => 4, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 40, 'stock_2' => 0, 'pt2' => 1280.00, 'pt3' => 1310.00, 'pt4' => 1340.00, 'pt5' => 1370.00, 'pt6' => 1400.00, 'pt7' => 1430.00],
            ['code' => 'RIC002', 'title' => 'Super Kernel Rice 5kg', 'short_name' => 'SK Rice 5kg', 'company' => 'Guard', 'category' => 'Rice', 'trade_price' => 980.00, 'retail' => 1150.00, 'packing_qty' => 4, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 32, 'stock_2' => 2, 'pt2' => 1000.00, 'pt3' => 1020.00, 'pt4' => 1040.00, 'pt5' => 1060.00, 'pt6' => 1080.00, 'pt7' => 1100.00],

            // Flour & Grains
            ['code' => 'FLR001', 'title' => 'Chakki Atta 10kg', 'short_name' => 'Atta 10kg', 'company' => 'K&N', 'category' => 'Flour', 'trade_price' => 850.00, 'retail' => 980.00, 'packing_qty' => 4, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 48, 'stock_2' => 0, 'pt2' => 870.00, 'pt3' => 890.00, 'pt4' => 910.00, 'pt5' => 930.00, 'pt6' => 950.00, 'pt7' => 970.00],
            ['code' => 'FLR002', 'title' => 'Maida 5kg', 'short_name' => 'Maida 5kg', 'company' => 'K&N', 'category' => 'Flour', 'trade_price' => 420.00, 'retail' => 500.00, 'packing_qty' => 6, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 54, 'stock_2' => 0, 'pt2' => 430.00, 'pt3' => 440.00, 'pt4' => 450.00, 'pt5' => 460.00, 'pt6' => 470.00, 'pt7' => 480.00],

            // Spices
            ['code' => 'SPC001', 'title' => 'National Salt 800g', 'short_name' => 'Salt 800g', 'company' => 'National Foods', 'category' => 'Spices', 'trade_price' => 35.00, 'retail' => 50.00, 'packing_qty' => 24, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 288, 'stock_2' => 0, 'pt2' => 37.00, 'pt3' => 39.00, 'pt4' => 41.00, 'pt5' => 43.00, 'pt6' => 45.00, 'pt7' => 47.00],
            ['code' => 'SPC002', 'title' => 'Shan Biryani Masala 100g', 'short_name' => 'Biryani 100g', 'company' => 'Shan Foods', 'category' => 'Spices', 'trade_price' => 95.00, 'retail' => 120.00, 'packing_qty' => 24, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 240, 'stock_2' => 12, 'pt2' => 98.00, 'pt3' => 101.00, 'pt4' => 104.00, 'pt5' => 107.00, 'pt6' => 110.00, 'pt7' => 113.00],
            ['code' => 'SPC003', 'title' => 'National Chilli Powder 200g', 'short_name' => 'Chilli 200g', 'company' => 'National Foods', 'category' => 'Spices', 'trade_price' => 180.00, 'retail' => 220.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 144, 'stock_2' => 0, 'pt2' => 185.00, 'pt3' => 190.00, 'pt4' => 195.00, 'pt5' => 200.00, 'pt6' => 205.00, 'pt7' => 210.00],

            // Tea & Coffee
            ['code' => 'TEA001', 'title' => 'Lipton Yellow Label 200g', 'short_name' => 'Lipton 200g', 'company' => 'Unilever', 'category' => 'Tea', 'trade_price' => 380.00, 'retail' => 450.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 120, 'stock_2' => 0, 'pt2' => 390.00, 'pt3' => 400.00, 'pt4' => 410.00, 'pt5' => 420.00, 'pt6' => 430.00, 'pt7' => 440.00],
            ['code' => 'TEA002', 'title' => 'Tapal Danedar 475g', 'short_name' => 'Tapal 475g', 'company' => 'Tapal', 'category' => 'Tea', 'trade_price' => 520.00, 'retail' => 620.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 96, 'stock_2' => 6, 'pt2' => 535.00, 'pt3' => 550.00, 'pt4' => 565.00, 'pt5' => 580.00, 'pt6' => 595.00, 'pt7' => 610.00],
            ['code' => 'COF001', 'title' => 'Nescafe Classic 100g', 'short_name' => 'Nescafe 100g', 'company' => 'Nestle', 'category' => 'Coffee', 'trade_price' => 680.00, 'retail' => 800.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 72, 'stock_2' => 0, 'pt2' => 700.00, 'pt3' => 720.00, 'pt4' => 740.00, 'pt5' => 760.00, 'pt6' => 780.00, 'pt7' => 790.00],

            // Noodles & Pasta
            ['code' => 'NOD001', 'title' => 'Indomie Chicken 75g', 'short_name' => 'Indomie 75g', 'company' => 'Indomie', 'category' => 'Noodles', 'trade_price' => 32.00, 'retail' => 45.00, 'packing_qty' => 40, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 480, 'stock_2' => 20, 'pt2' => 34.00, 'pt3' => 36.00, 'pt4' => 38.00, 'pt5' => 40.00, 'pt6' => 42.00, 'pt7' => 44.00],
            ['code' => 'NOD002', 'title' => 'Kolson Spaghetti 400g', 'short_name' => 'Spaghetti 400g', 'company' => 'Kolson', 'category' => 'Pasta', 'trade_price' => 125.00, 'retail' => 160.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 144, 'stock_2' => 0, 'pt2' => 130.00, 'pt3' => 135.00, 'pt4' => 140.00, 'pt5' => 145.00, 'pt6' => 150.00, 'pt7' => 155.00],

            // Sauces & Condiments
            ['code' => 'SAU001', 'title' => 'National Ketchup 1kg', 'short_name' => 'Ketchup 1kg', 'company' => 'National Foods', 'category' => 'Sauces', 'trade_price' => 280.00, 'retail' => 340.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 120, 'stock_2' => 0, 'pt2' => 290.00, 'pt3' => 300.00, 'pt4' => 310.00, 'pt5' => 320.00, 'pt6' => 330.00, 'pt7' => 335.00],
            ['code' => 'SAU002', 'title' => 'Shangrila Chilli Sauce 800g', 'short_name' => 'Chilli 800g', 'company' => 'Shangrila', 'category' => 'Sauces', 'trade_price' => 220.00, 'retail' => 270.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 108, 'stock_2' => 6, 'pt2' => 230.00, 'pt3' => 240.00, 'pt4' => 250.00, 'pt5' => 260.00, 'pt6' => 265.00, 'pt7' => 268.00],

            // Juices
            ['code' => 'JUI001', 'title' => 'Nestle Fruita Vitals 1L', 'short_name' => 'Fruita 1L', 'company' => 'Nestle', 'category' => 'Juices', 'trade_price' => 180.00, 'retail' => 220.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 144, 'stock_2' => 0, 'pt2' => 185.00, 'pt3' => 190.00, 'pt4' => 195.00, 'pt5' => 200.00, 'pt6' => 205.00, 'pt7' => 210.00],
            ['code' => 'JUI002', 'title' => 'Shezan Mango 1L', 'short_name' => 'Shezan 1L', 'company' => 'Shezan', 'category' => 'Juices', 'trade_price' => 195.00, 'retail' => 240.00, 'packing_qty' => 12, 'pcs' => 1, 'gst_percent' => 17.00, 'stock_1' => 120, 'stock_2' => 6, 'pt2' => 200.00, 'pt3' => 205.00, 'pt4' => 210.00, 'pt5' => 215.00, 'pt6' => 220.00, 'pt7' => 225.00],
        ];

        $now = Carbon::now();

        foreach ($items as $item) {
            DB::table('items')->insert(array_merge($item, [
                'date' => $now->toDateString(),
                'retail_tp_diff' => $item['retail'] - $item['trade_price'],
                'reorder_level' => 50,
                'packing_full' => 0,
                'packing_pcs' => 0,
                'is_active' => true,
                'is_import' => false,
                'is_fridge' => in_array($item['category'], ['Dairy', 'Beverages']),
                'is_recipe' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }
    }
}
