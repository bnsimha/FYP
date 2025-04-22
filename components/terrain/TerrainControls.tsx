"use client";

import { useState } from "react";
import { Sliders, X, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTerrainStore } from "@/lib/stores/terrainStore";
import { TerrainClient } from "@/lib/grpc/terrainClient";

interface TerrainControlsProps {
  onToggle: () => void;
}

export default function TerrainControls({ onToggle }: TerrainControlsProps) {
  const { parameters, updateParameters, regenerate } = useTerrainStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      // Update parameters on the server
      const client = new TerrainClient();
      await client.updateTerrainParameters({
        scale: parameters.scale,
        amplitude: parameters.amplitude,
        octaves: parameters.octaves,
        persistence: parameters.persistence,
        lacunarity: parameters.lacunarity,
        seed: parameters.seed,
      });
      
      // Trigger regeneration
      regenerate();
    } catch (error) {
      console.error("Failed to update terrain parameters:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-[300px] bg-card/80 backdrop-blur-sm shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sliders className="h-4 w-4" />
          Terrain Controls
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="scale">Scale ({parameters.scale})</Label>
          </div>
          <Slider
            id="scale"
            min={0.001}
            max={0.1}
            step={0.001}
            value={[parameters.scale]}
            onValueChange={(values) => updateParameters({ scale: values[0] })}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="amplitude">Amplitude ({parameters.amplitude})</Label>
          </div>
          <Slider
            id="amplitude"
            min={0.1}
            max={5}
            step={0.1}
            value={[parameters.amplitude]}
            onValueChange={(values) => updateParameters({ amplitude: values[0] })}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="octaves">Octaves ({parameters.octaves})</Label>
          </div>
          <Slider
            id="octaves"
            min={1}
            max={8}
            step={1}
            value={[parameters.octaves]}
            onValueChange={(values) => updateParameters({ octaves: values[0] })}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="persistence">Persistence ({parameters.persistence})</Label>
          </div>
          <Slider
            id="persistence"
            min={0.1}
            max={1}
            step={0.05}
            value={[parameters.persistence]}
            onValueChange={(values) => updateParameters({ persistence: values[0] })}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="lacunarity">Lacunarity ({parameters.lacunarity})</Label>
          </div>
          <Slider
            id="lacunarity"
            min={1}
            max={3}
            step={0.1}
            value={[parameters.lacunarity]}
            onValueChange={(values) => updateParameters({ lacunarity: values[0] })}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="resolution">Resolution ({parameters.resolution})</Label>
          </div>
          <Slider
            id="resolution"
            min={16}
            max={256}
            step={16}
            value={[parameters.resolution]}
            onValueChange={(values) => updateParameters({ resolution: values[0] })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="seed">Seed ({parameters.seed})</Label>
          </div>
          <Slider
            id="seed"
            min={10000}
            max={20000}
            step={400}
            value={[parameters.seed]}
            onValueChange={(values) => updateParameters({ seed: values[0] })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="wireframe">Wireframe</Label>
          <Switch 
            id="wireframe" 
            checked={parameters.wireframe}
            onCheckedChange={(checked) => updateParameters({ wireframe: checked })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="flatShading">Flat Shading</Label>
          <Switch 
            id="flatShading" 
            checked={parameters.flatShading}
            onCheckedChange={(checked) => updateParameters({ flatShading: checked })}
          />
        </div>
        
        <Button 
          onClick={handleUpdate} 
          className="w-full"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Terrain"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}