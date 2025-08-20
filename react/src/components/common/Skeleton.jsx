// src/components/common/Skeleton.jsx
import React from 'react';

export default function Skeleton({ height = 16, width = '100%', radius = 10, style }) {
  return (
    <div
      className="skeleton"
      style={{
        height,
        width,
        borderRadius: radius,
        ...style,
      }}
    />
  );
}
