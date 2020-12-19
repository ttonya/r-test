// Libs
import React, { ChangeEvent, useEffect } from "react";
import mapboxgl, { LngLatBounds, Map } from "mapbox-gl";
import booleanIntersects from "@turf/boolean-intersects";

// Styles
import "./MapComponent.scss";

//App
import SourceType from "../../common/dto/SourceType";
import { ACCESS_TOKEN } from "../../consts";
import calculateCoordinates from "../../common/utils/calculateCoords";

export default function MapComponent() {
	let map: Map;
	mapboxgl.accessToken = ACCESS_TOKEN;
	let features: any[] = [];

	const initMap = (): void => {
		map = (window as any).map = new mapboxgl.Map({
			container: "map",
			zoom: 3,
			center: [-73.982333, 40.755555],
			style: "mapbox://styles/mapbox/streets-v11",
		});
	};

	const renderSources = (sources: Array<SourceType>): void => {
		let bounds = new mapboxgl.LngLatBounds();

		sources.map((source) => {
			let feature = calculateCoordinates(source);

			let sourceName = `${Math.random()}${source.center_lat}`;

			let addToBounds = getBounds(
				feature.geometry.coordinates[0] as number[][]
			);

			bounds.extend(addToBounds);
			features.push(feature);

			map.addSource(sourceName, {
				type: "geojson",
				data: feature,
			});

			map.addLayer({
				id: sourceName,
				type: "fill",
				source: sourceName,
				paint: {
					"fill-color": `${source.color}`,
					"fill-opacity": 0.5,
				},
			});
		});

		addRedBorder();
		map.fitBounds(bounds);
	};

	const getBounds = (coords: number[][]): LngLatBounds => {
		let southWestCoords = coords[3];
		let northWestCoords = coords[1];

		let sw = new mapboxgl.LngLat(southWestCoords[0], southWestCoords[1]);
		let ne = new mapboxgl.LngLat(northWestCoords[0], northWestCoords[1]);

		return new mapboxgl.LngLatBounds(sw, ne);
	};

	const addRedBorder = (): void => {
		let layersThatIntersect = findIntersections();

		layersThatIntersect.forEach((layer, i) => {
			let sourceName = `${Math.random()}${layer.center_lat}`;
			map.addSource(sourceName, {
				type: "geojson",
				data: {
					type: "Feature",
					properties: {},
					geometry: {
						type: "LineString",
						coordinates: layer.geometry.coordinates[0],
					},
				},
			});
			map.addLayer({
				id: sourceName,
				type: "line",
				source: sourceName,
				layout: {
					"line-join": "round",
					"line-cap": "round",
				},
				paint: {
					"line-color": "red",
					"line-width": 5,
				},
			});
		});
	};

	const findIntersections = () => {
		let objectsThatIntersect: any[] = [];

		let featuresCopy = features;

		features.forEach((feature, i) => {
			featuresCopy.forEach((copyfeature, index) => {
				if (booleanIntersects(feature, copyfeature) && i !== index) {
					objectsThatIntersect.push(feature);
				}
			});
		});

		return objectsThatIntersect;
	};

	const importJSON = (e: ChangeEvent<HTMLInputElement>): void => {
		let document = e.target.files ? e.target.files[0] : null;

		const reader = new FileReader();

		reader.onload = function (e: ProgressEvent<FileReader>) {
			let fileText = JSON.parse(e.target?.result as string);
			renderSources(fileText.data);
		};

		if (document) {
			reader.readAsText(document);
		}

		e.target.value = "";
	};

	const openFileObserver = (): void => {
		let inputRef = document.getElementById("file-import");
		inputRef?.click();
	};

	useEffect(() => {
		initMap();
	}, []);

	return (
		<div className="MapComponent">
			<button className="MapComponent__import" onClick={openFileObserver}>
				Import JSON
			</button>

			<input id="file-import" type="file" hidden onChange={importJSON} />

			<div id="map" className="MapComponent__map"></div>
		</div>
	);
}
