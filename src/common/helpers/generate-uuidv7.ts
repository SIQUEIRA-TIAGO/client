export const generateUUIDv7 = () => {
   
    const now = Date.now();
    
  
    const timeHigh = Math.floor(now / 0x100000000).toString(16).padStart(8, '0');
    const timeLow = (now % 0x100000000).toString(16).padStart(8, '0');
    

    const randomPart1 = Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0');
    const randomPart2 = Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
    const randomPart3 = Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');

    
    const uuid = `${timeHigh}-${timeLow.slice(0, 4)}-${timeLow.slice(4, 8)}-7${randomPart2.slice(1)}-${randomPart3}${randomPart1}`;

    return uuid;
}
