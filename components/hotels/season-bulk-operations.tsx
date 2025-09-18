"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, RotateCcw, Calendar, AlertTriangle } from "lucide-react";
import { 
  SeasonData, 
  copySeasonToNextYear, 
  adjustSeasonToCurrentYear,
  getSeasonStatus,
  formatSeasonDate,
  getSeasonYear
} from "@/lib/utils/season-management";

interface SeasonBulkOperationsProps {
  selectedSeasons: SeasonData[];
  onSuccess: () => void;
  onClearSelection: () => void;
}

export function SeasonBulkOperations({ 
  selectedSeasons, 
  onSuccess, 
  onClearSelection 
}: SeasonBulkOperationsProps) {
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showRollingModal, setShowRollingModal] = useState(false);
  const [targetYear, setTargetYear] = useState(new Date().getFullYear() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const supabase = createClient();

  const pastSeasons = selectedSeasons.filter(season => 
    getSeasonStatus(season.start_date, season.end_date).status === 'past'
  );

  const handleCopyToNextYear = async () => {
    if (selectedSeasons.length === 0) return;

    try {
      setLoading(true);
      setError("");

      const newSeasons = selectedSeasons.map(season => 
        copySeasonToNextYear(season, targetYear)
      );

      const { error: insertError } = await supabase
        .from('hotels_seasons')
        .insert(newSeasons);

      if (insertError) {
        console.error('Error copying seasons:', insertError);
        setError("Failed to copy seasons. Please try again.");
        return;
      }

      onSuccess();
      setShowCopyModal(false);
      onClearSelection();
    } catch (error) {
      console.error('Error copying seasons:', error);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRollingYear = async () => {
    if (selectedSeasons.length === 0) return;

    try {
      setLoading(true);
      setError("");

      const currentYear = new Date().getFullYear();
      const updates = selectedSeasons.map(season => 
        adjustSeasonToCurrentYear(season)
      );

      // Update each season
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('hotels_seasons')
          .update({
            start_date: update.start_date,
            end_date: update.end_date
          })
          .eq('id', update.id);

        if (updateError) {
          console.error('Error updating season:', updateError);
          setError("Failed to update some seasons. Please try again.");
          return;
        }
      }

      onSuccess();
      setShowRollingModal(false);
      onClearSelection();
    } catch (error) {
      console.error('Error updating seasons:', error);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSeasons.length === 0) return;

    try {
      setLoading(true);
      setError("");

      const { error: deleteError } = await supabase
        .from('hotels_seasons')
        .delete()
        .in('id', selectedSeasons.map(s => s.id));

      if (deleteError) {
        console.error('Error deleting seasons:', deleteError);
        setError("Failed to delete seasons. Please try again.");
        return;
      }

      onSuccess();
      onClearSelection();
    } catch (error) {
      console.error('Error deleting seasons:', error);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (selectedSeasons.length === 0) {
    return null;
  }

  return (
    <div className="px-6 py-3 border-b border-gray-200 bg-blue-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">
            {selectedSeasons.length} season{selectedSeasons.length !== 1 ? 's' : ''} selected
          </span>
          
          {pastSeasons.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCopyModal(true)}
              disabled={loading}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Next Year ({pastSeasons.length})
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRollingModal(true)}
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Adjust to Current Year
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            disabled={loading}
            className="text-red-600 hover:text-red-700"
          >
            <Loader2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={loading}
        >
          Clear Selection
        </Button>
      </div>

      {/* Copy to Next Year Modal */}
      <Modal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        title="Copy Seasons to Next Year"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Copy Past Seasons</h4>
                <p className="text-sm text-blue-700 mt-1">
                  This will create new seasons for {targetYear} with the same names and date patterns 
                  as the selected past seasons.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="target-year">Target Year</Label>
            <Input
              id="target-year"
              type="number"
              value={targetYear}
              onChange={(e) => setTargetYear(parseInt(e.target.value))}
              min={new Date().getFullYear()}
              className="mt-1"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Seasons to Copy:</Label>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {pastSeasons.map((season) => (
                <div key={season.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{season.season_name}</span>
                    <div className="text-sm text-gray-600">
                      {formatSeasonDate(season.start_date)} - {formatSeasonDate(season.end_date)}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getSeasonYear(season.start_date)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowCopyModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopyToNextYear} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Copy Seasons
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rolling Year Modal */}
      <Modal
        isOpen={showRollingModal}
        onClose={() => setShowRollingModal(false)}
        title="Adjust Seasons to Current Year"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Rolling Year Adjustment</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  This will update the selected seasons to use the current year ({new Date().getFullYear()}) 
                  while keeping the same month and day patterns.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Seasons to Update:</Label>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {selectedSeasons.map((season) => {
                const currentYear = new Date().getFullYear();
                const startDate = new Date(season.start_date);
                const endDate = new Date(season.end_date);
                
                startDate.setFullYear(currentYear);
                endDate.setFullYear(currentYear);
                
                return (
                  <div key={season.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{season.season_name}</span>
                      <div className="text-sm text-gray-600">
                        {formatSeasonDate(season.start_date)} - {formatSeasonDate(season.end_date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs mb-1">
                        {getSeasonYear(season.start_date)}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        → {currentYear}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowRollingModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleRollingYear} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Seasons
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 