import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from "@/components/ui/button";
import { MapPin, Globe } from "lucide-react";

// Fix for default marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;

interface LocationData {
    id: number;
    name: string;
    latitude: string | null;
    longitude: string | null;
    sales_count: number;
    total_amount: string | number;
}

interface SalesMapProps {
    data: LocationData[];
    center: [number, number];
    zoom: number;
    level: string;
    formatCurrency: (amount: string | number) => string;
    onLocationClick: (loc: LocationData) => void;
}

const createCustomIcon = (count: number) => {
    return L.divIcon({
        className: 'pro-sales-marker',
        html: `
            <div class="pro-marker-wrapper">
                <div class="pro-marker-pulse"></div>
                <div class="pro-marker-dot"></div>
                <div class="pro-marker-pin">
                    <span class="count">${count}</span>
                </div>
            </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [15, 30],
        popupAnchor: [0, -32]
    });
};

function MapController({ center, zoom, level }: { center: [number, number], zoom: number, level: string }) {
    const map = useMap();
    useEffect(() => {
        // If level is country, zoom out to see everything
        if (level === 'country') {
            map.setView([30.3753, 69.3451], 5, { animate: true, duration: 2 });
        } else {
            map.setView(center, zoom, { animate: true, duration: 1.2 });
        }

        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }, [center, zoom, map, level]);
    return null;
}

const SalesMap: React.FC<SalesMapProps> = ({ data, center, zoom, level, formatCurrency, onLocationClick }) => {
    const [geoJson, setGeoJson] = useState<any>(null);

    useEffect(() => {
        // Fetch a more comprehensive Pakistan border GeoJSON
        // This repo usually has officially claimed borders
        fetch('https://raw.githubusercontent.com/hqakhtar/PakistanMap/master/Pakistan_Boundary.geojson')
            .then(res => {
                if (!res.ok) throw new Error("Failed to load official boundary");
                return res.json();
            })
            .then(data => setGeoJson(data))
            .catch(() => {
                // Fallback to the other one if fail
                fetch('https://raw.githubusercontent.com/PakData/GISData/master/PAK-GeoJSON/PAK_adm0.json')
                    .then(res => res.json())
                    .then(data => setGeoJson(data));
            });
    }, []);

    const borderStyle = {
        color: "#F54A00",
        weight: 4,
        opacity: 0.9,
        fillColor: "#F54A00",
        fillOpacity: 0.03,
        dashArray: "8, 12",
        lineCap: "round" as const,
        lineJoin: "round" as const
    };

    return (
        <div className="h-full w-full relative group/map">
            <style dangerouslySetInnerHTML={{
                __html: `
                .pro-sales-marker {
                    background: transparent;
                    border: none;
                }
                .pro-marker-wrapper {
                    position: relative;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .pro-marker-pin {
                    position: absolute;
                    width: 28px;
                    height: 28px;
                    background: linear-gradient(135deg, #FF7A45 0%, #F54A00 100%);
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    top: -14px;
                    left: 1px;
                    border: 2px solid white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 8px rgba(245, 74, 0, 0.4), inset 0 1px 2px rgba(255,255,255,0.3);
                    z-index: 10;
                    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    cursor: pointer;
                }
                .pro-marker-pin .count {
                    transform: rotate(45deg);
                    color: white;
                    font-size: 11px;
                    font-weight: 900;
                    font-family: inherit;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }
                .pro-marker-wrapper:hover .pro-marker-pin {
                    transform: rotate(-45deg) scale(1.15);
                    box-shadow: 0 6px 15px rgba(245, 74, 0, 0.5);
                }
                .pro-marker-pulse {
                    position: absolute;
                    width: 14px;
                    height: 14px;
                    background: rgba(245, 74, 0, 0.4);
                    border-radius: 50%;
                    bottom: -7px;
                    left: 8px;
                    z-index: 1;
                    animation: pro-marker-ripple 2s ease-out infinite;
                }
                .pro-marker-dot {
                    position: absolute;
                    width: 6px;
                    height: 6px;
                    background: #F54A00;
                    border: 1.5px solid white;
                    border-radius: 50%;
                    bottom: -3px;
                    left: 12px;
                    z-index: 2;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                }
                @keyframes pro-marker-ripple {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(4); opacity: 0; }
                }
                .premium-popup .leaflet-popup-content-wrapper {
                    background: rgba(255, 255, 255, 0.98);
                    border-radius: 16px !important;
                    padding: 0 !important;
                    box-shadow: 0 20px 40px -10px rgba(245, 74, 0, 0.2) !important;
                    border: 1px solid rgba(245, 74, 0, 0.05) !important;
                    overflow: hidden;
                }
                .premium-popup .leaflet-popup-content {
                    margin: 0 !important;
                    width: auto !important;
                }
            `}} />
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%', outline: 'none', background: '#f8fafc' }}
                scrollWheelZoom={true}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {geoJson && (
                    <GeoJSON
                        data={geoJson}
                        style={borderStyle}
                    />
                )}

                <MapController center={center} zoom={zoom} level={level} />

                {data.filter(d => d.latitude && d.longitude).map((loc) => (
                    <Marker
                        key={loc.id}
                        position={[parseFloat(loc.latitude!), parseFloat(loc.longitude!)]}
                        icon={createCustomIcon(loc.sales_count)}
                    >
                        <Popup className="premium-popup">
                            <div className="p-0 min-w-[180px] font-sans">
                                <div className="px-4 py-3 flex items-center gap-3 bg-orange-50/30 border-b border-orange-100/50">
                                    <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-[#F54A00]">
                                        <MapPin className="w-3.5 h-3.5" />
                                    </div>
                                    <h4 className="font-bold text-xs text-gray-900 tracking-tight">{loc.name}</h4>
                                </div>

                                <div className="p-3 space-y-1.5">
                                    <div className="flex justify-between items-center px-3 py-1.5 bg-gray-50/50 rounded-lg border border-gray-100/50">
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Orders</span>
                                        <span className="text-sm font-bold text-gray-900">{loc.sales_count}</span>
                                    </div>
                                    <div className="flex justify-between items-center px-3 py-1.5 bg-orange-50/50 rounded-lg border border-orange-100/50">
                                        <span className="text-[10px] font-semibold text-[#F54A00]/70 uppercase tracking-wider">Revenue</span>
                                        <span className="text-sm font-bold text-[#F54A00]">{formatCurrency(loc.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default SalesMap;
