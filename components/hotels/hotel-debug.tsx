"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function HotelDebug() {
  const [hotels, setHotels] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch hotels
      const { data: hotelsData, error: hotelsError } = await supabase
        .from('hotels')
        .select('*')
        .limit(10);

      if (hotelsError) {
        console.error('Error fetching hotels:', hotelsError);
        setError(`Hotels error: ${hotelsError.message}`);
      } else {
        console.log('Hotels data:', hotelsData);
        setHotels(hotelsData || []);
      }

      // Fetch seasons separately to avoid RLS issues
      const { data: seasonsData, error: seasonsError } = await supabase
        .from('hotels_seasons')
        .select('*')
        .limit(10);

      if (seasonsError) {
        console.error('Error fetching seasons:', seasonsError);
        setError(prev => prev + ` | Seasons error: ${seasonsError.message}`);
      } else {
        console.log('Seasons data:', seasonsData);
        
        // Combine with hotel data
        const combinedSeasons = seasonsData?.map(season => ({
          ...season,
          hotels: hotelsData?.find(hotel => hotel.id === season.hotel_id) || null
        })) || [];
        
        setSeasons(combinedSeasons);
      }

    } catch (error) {
      console.error('Error in fetchData:', error);
      setError(`Unexpected error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading debug data...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-4">Hotel Debug Information</h3>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Hotels ({hotels.length})</h4>
          <div className="bg-white p-2 rounded border">
            {hotels.length === 0 ? (
              <p className="text-gray-500">No hotels found</p>
            ) : (
              <ul className="space-y-1">
                {hotels.map((hotel) => (
                  <li key={hotel.id} className="text-sm">
                    ID: {hotel.id} - {hotel.hotel_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Seasons ({seasons.length})</h4>
          <div className="bg-white p-2 rounded border">
            {seasons.length === 0 ? (
              <p className="text-gray-500">No seasons found</p>
            ) : (
              <ul className="space-y-1">
                {seasons.map((season) => (
                  <li key={season.id} className="text-sm">
                    {season.season_name} - Hotel: {season.hotels?.hotel_name || 'Unknown'} (ID: {season.hotel_id})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold mb-2">Analysis</h4>
        <div className="bg-white p-2 rounded border text-sm">
          {hotels.length === 0 && (
            <p className="text-red-600">❌ No hotels found - This is why you see "Unknown Hotel"</p>
          )}
          {hotels.length > 0 && seasons.length > 0 && seasons.some(s => !s.hotels?.hotel_name) && (
            <p className="text-orange-600">⚠️ Some seasons have missing hotel data - Check hotel_id values</p>
          )}
          {hotels.length > 0 && seasons.length > 0 && seasons.every(s => s.hotels?.hotel_name) && (
            <p className="text-green-600">✅ All seasons have hotel data - Issue might be in frontend</p>
          )}
        </div>
      </div>

      <button 
        onClick={fetchData}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Refresh Data
      </button>
    </div>
  );
} 