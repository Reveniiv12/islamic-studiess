import React from "react";
import { FaStar } from "react-icons/fa";

const StarRating = ({ count }) => {
    return (
        <div className="flex gap-1 text-yellow-400">
            {Array.from({ length: 10 }).map((_, index) => (
                <FaStar
                    key={index}
                    className={index < count ? "text-yellow-400" : "text-gray-600"}
                />
            ))}
        </div>
    );
};

export default StarRating;
