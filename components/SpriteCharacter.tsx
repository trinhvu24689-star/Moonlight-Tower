import React, { useEffect, useState } from 'react';

// Cấu hình kích thước chuẩn của 1 nhân vật (tuỳ ảnh vk cắt, thường là 64x64 hoặc 128x128)
const FRAME_WIDTH = 64; 
const FRAME_HEIGHT = 64;

interface SpriteProps {
  imageSrc: string;     // Đường dẫn ảnh (VD: /characters.png)
  totalFrames: number;  // Số lượng khung hình của hành động (VD: chém là 4 khung)
  row: number;          // Hàng thứ mấy trong ảnh (0 là hàng đầu tiên)
  speed?: number;       // Tốc độ (ms), càng nhỏ càng nhanh
  scale?: number;       // Phóng to thu nhỏ
}

const SpriteCharacter: React.FC<SpriteProps> = ({ 
  imageSrc, 
  totalFrames, 
  row, 
  speed = 150, 
  scale = 1 
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }, speed);

    return () => clearInterval(timer);
  }, [totalFrames, speed]);

  // Tính toán vị trí cần hiển thị
  const positionX = -(currentFrame * FRAME_WIDTH);
  const positionY = -(row * FRAME_HEIGHT);

  return (
    <div
      style={{
        width: `${FRAME_WIDTH}px`,
        height: `${FRAME_HEIGHT}px`,
        backgroundImage: `url(${imageSrc})`,
        backgroundPosition: `${positionX}px ${positionY}px`,
        backgroundRepeat: 'no-repeat',
        transform: `scale(${scale})`,
        transformOrigin: 'top left', // Giữ vị trí khi phóng to
        imageRendering: 'pixelated', // QUAN TRỌNG: Giữ nét pixel, không bị mờ
      }}
    />
  );
};

export default SpriteCharacter;