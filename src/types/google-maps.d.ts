// Google Maps types declaration
declare global {
  interface Window {
    google: typeof google;
  }
}

declare namespace google {
  namespace maps {
    class Loader {
      constructor(options: { apiKey: string; version: string; libraries: string[] });
      load(): Promise<void>;
    }

    namespace places {
      interface PlaceResult {
        formatted_address?: string;
        address_components?: AddressComponent[];
        geometry?: Geometry;
        place_id?: string;
      }

      interface AddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }

      interface Geometry {
        location: LatLng;
      }

      interface LatLng {
        lat(): number;
        lng(): number;
      }

      class Autocomplete {
        constructor(input: HTMLInputElement, options?: AutocompleteOptions);
        addListener(eventName: string, handler: () => void): void;
        getPlace(): PlaceResult;
      }

      interface AutocompleteOptions {
        types?: string[];
        componentRestrictions?: { country: string };
        fields?: string[];
      }
    }

    namespace event {
      function clearInstanceListeners(instance: any): void;
    }
  }
}

export {};