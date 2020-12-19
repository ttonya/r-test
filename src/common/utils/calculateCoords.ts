import SourceType from "../dto/SourceType";
import transformRotate from "@turf/transform-rotate";
import { Feature, Geometry, polygon, Position } from "@turf/helpers";

const earthRadius = 6371;

function getCoords(
	lat: number,
	long: number,
	distance: number,
	bearing: number
): number[] {
	const { cos, sin, asin, atan2 } = Math;
	const angle = toRadians(bearing);

	let lat1 = toRadians(lat);
	let long1 = toRadians(long);

	let lat2 = asin(
		sin(lat1) * cos(distance / earthRadius) +
			cos(lat1) * sin(distance / earthRadius) * cos(angle)
	);
	let long2 =
		long1 +
		atan2(
			sin(angle) * sin(distance / earthRadius) * cos(lat1),
			cos(distance / earthRadius) - sin(lat1) * sin(lat2)
		);

	return [toDegrees(long2), toDegrees(lat2)];
}

function toRadians(degrees: number): number {
	return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
	return radians * (180 / Math.PI);
}

export default function calculateCoordinates(params: SourceType): Feature<any> {
	let { center_lat, center_lng, width, length, yaw_angle } = params;

	let distanceW = width / 2;
	let distanceL = length / 2;

	let top = getCoords(center_lat, center_lng, distanceW, 0);
	let bottom = getCoords(center_lat, center_lng, distanceW, 180);
	let right = getCoords(center_lat, center_lng, distanceL, 90);
	let left = getCoords(center_lat, center_lng, distanceL, 270);

	let leftTop: Position = [left[0], top[1]];
	let rightTop: Position = [right[0], top[1]];
	let rightBottom: Position = [right[0], bottom[1]];
	let leftBottom: Position = [left[0], bottom[1]];

	let poly = polygon([[leftTop, rightTop, rightBottom, leftBottom, leftTop]]);

	let feature = transformRotate<Feature<Geometry>>(poly, yaw_angle, {
		pivot: [center_lng, center_lat],
	});

	return feature;
}
