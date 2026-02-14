import SPI from 'pi-spi';
import rpio from 'rpio';

class SH1107Display {
    private spi: SPI.SPI;
    private width: number = 128;
    private height: number = 128;
    private pages: number = 16;
    private buffer: Buffer;

    private pinDC: number = 24;
    private pinRST: number = 25;

    private static readonly Commands = {
        SET_CONTRAST: 0x81,
        ENTIRE_DISPLAY_ON: 0xA5,
        ENTIRE_DISPLAY_OFF: 0xA4,
        NORMAL_DISPLAY: 0xA6,
        INVERSE_DISPLAY: 0xA7,
        DISPLAY_OFF: 0xAE,
        DISPLAY_ON: 0xAF,
        SET_DISPLAY_OFFSET: 0xD3,
        SET_MULTIPLEX_RATIO: 0xA8,
        SET_SEGMENT_REMAP_0: 0xA0,
        SET_SEGMENT_REMAP_127: 0xA1,
        SET_COM_SCAN_INC: 0xC0,
        SET_COM_SCAN_DEC: 0xC8,
        SET_MEMORY_MODE: 0x20,
        SET_COLUMN_LOW: 0x00,
        SET_COLUMN_HIGH: 0x10,
        SET_PAGE_START: 0xB0,
        SET_DISPLAY_START_LINE: 0xDC,
    };

    // 5x8 font data definition
    private readonly font5x8: { [key: string]: number[] } = {
        'A': [0x7C, 0x12, 0x11, 0x12, 0x7C], 'B': [0x7F, 0x49, 0x49, 0x49, 0x36],
        'C': [0x3E, 0x41, 0x41, 0x41, 0x22], 'D': [0x7F, 0x41, 0x41, 0x22, 0x1C],
        'E': [0x7F, 0x49, 0x49, 0x49, 0x41], 'F': [0x7F, 0x09, 0x09, 0x09, 0x01],
        'G': [0x3E, 0x41, 0x49, 0x49, 0x7A], 'H': [0x7F, 0x08, 0x08, 0x08, 0x7F],
        'I': [0x00, 0x41, 0x7F, 0x41, 0x00], 'J': [0x20, 0x40, 0x41, 0x3F, 0x01],
        'K': [0x7F, 0x08, 0x14, 0x22, 0x41], 'L': [0x7F, 0x40, 0x40, 0x40, 0x40],
        'M': [0x7F, 0x02, 0x0C, 0x02, 0x7F], 'N': [0x7F, 0x04, 0x08, 0x10, 0x7F],
        'O': [0x3E, 0x41, 0x41, 0x41, 0x3E], 'P': [0x7F, 0x09, 0x09, 0x09, 0x06],
        'Q': [0x3E, 0x41, 0x51, 0x21, 0x5E], 'R': [0x7F, 0x09, 0x19, 0x29, 0x46],
        'S': [0x46, 0x49, 0x49, 0x49, 0x31], 'T': [0x01, 0x01, 0x7F, 0x01, 0x01],
        'U': [0x3F, 0x40, 0x40, 0x40, 0x3F], 'V': [0x1F, 0x20, 0x40, 0x20, 0x1F],
        'W': [0x3F, 0x40, 0x30, 0x40, 0x3F], 'X': [0x63, 0x14, 0x08, 0x14, 0x63],
        'Y': [0x07, 0x08, 0x70, 0x08, 0x07], 'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
        ' ': [0x00, 0x00, 0x00, 0x00, 0x00], '0': [0x3E, 0x51, 0x49, 0x45, 0x3E],
        '1': [0x00, 0x42, 0x7F, 0x40, 0x00], '2': [0x42, 0x61, 0x51, 0x49, 0x46],
        '3': [0x21, 0x41, 0x45, 0x4B, 0x31], '4': [0x18, 0x14, 0x12, 0x7F, 0x10],
        '5': [0x27, 0x45, 0x45, 0x45, 0x39], '6': [0x3C, 0x4A, 0x49, 0x49, 0x30],
        '7': [0x01, 0x71, 0x09, 0x05, 0x03], '8': [0x36, 0x49, 0x49, 0x49, 0x36],
        '9': [0x06, 0x49, 0x49, 0x29, 0x1E],
        '.': [0x00, 0x60, 0x60, 0x00, 0x00], '-': [0x08, 0x08, 0x08, 0x08, 0x08],
        '%': [0x23, 0x13, 0x08, 0x64, 0x62], ':': [0x00, 0x36, 0x36, 0x00, 0x00],
        '/': [0x20, 0x10, 0x08, 0x04, 0x02], '+': [0x08, 0x08, 0x3E, 0x08, 0x08],
    };

    constructor(device: string = '/dev/spidev0.0') {
        this.buffer = Buffer.alloc((this.width * this.height) / 8);
        rpio.init({ mapping: 'gpio' });
        rpio.open(this.pinDC, rpio.OUTPUT, rpio.LOW);
        rpio.open(this.pinRST, rpio.OUTPUT, rpio.HIGH);
        this.spi = SPI.initialize(device);
        this.spi.clockSpeed(2000000); // Lower speed to 2MHz for stability
    }

    private reset(): void {
        rpio.write(this.pinRST, rpio.LOW);
        rpio.msleep(50);
        rpio.write(this.pinRST, rpio.HIGH);
        rpio.msleep(50);
    }

    private writeCommand(command: number | number[]): Promise<void> {
        return new Promise((resolve, reject) => {
            rpio.write(this.pinDC, rpio.LOW);
            const cmds = Array.isArray(command) ? command : [command];
            this.spi.write(Buffer.from(cmds), (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    private writeData(data: Buffer | number[]): Promise<void> {
        return new Promise((resolve, reject) => {
            rpio.write(this.pinDC, rpio.HIGH);
            const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
            this.spi.write(buf, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    public async initialize(): Promise<void> {
        this.reset();

        // SH1107 128x128 stable initialization sequence
        const initCmds = [
            0xAE,             // Display OFF
            0xD5, 0x50,       // Set Display Clock Divide Ratio
            0xA8, 0x7F,       // Set Multiplex Ratio (128)
            0xD3, 0x00,       // Set Display Offset (0)
            0xDC, 0x00,       // Set Display Start Line (0)
            0xA0,             // Set Segment Re-map (Normal)
            0xC0,             // Set COM Output Scan Direction (Normal)
            0x81, 0x80,       // Set Contrast Control
            0xD9, 0x22,       // Set Pre-charge Period
            0xDB, 0x35,       // Set VCOMH Deselect Level
            0xAD, 0x81,       // Set DC-DC Control Mode (On)
            0xA4,             // Set Entire Display On/Off (Normal)
            0xA6,             // Set Normal/Inverse Display (Normal)
            0xAF              // Display ON
        ];

        for (const cmd of initCmds) {
            await this.writeCommand(cmd);
        }

        this.clear();
        await this.display();
    }

    public async display(): Promise<void> {
        for (let page = 0; page < this.pages; page++) {
            await this.writeCommand([
                SH1107Display.Commands.SET_PAGE_START + page,
                SH1107Display.Commands.SET_COLUMN_LOW,
                SH1107Display.Commands.SET_COLUMN_HIGH
            ]);
            const start = page * this.width;
            await this.writeData(this.buffer.slice(start, start + this.width));
        }
    }

    public clear(): void {
        this.buffer.fill(0x00);
    }

    public setPixel(x: number, y: number, color: boolean = true): void {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
        const page = Math.floor(y / 8);
        const bit = y % 8;
        const index = x + (page * this.width);
        if (color) this.buffer[index] |= (1 << bit);
        else this.buffer[index] &= ~(1 << bit);
    }

    // Text drawing method (Error resolution point)
    public drawText(x: number, y: number, text: string, scale: number = 1): void {
        let currentX = x;
        for (const char of text.toUpperCase()) {
            if (this.font5x8[char]) {
                const charData = this.font5x8[char];
                for (let col = 0; col < 5; col++) {
                    const columnData = charData[col];
                    for (let row = 0; row < 8; row++) {
                        if (columnData & (1 << row)) {
                            for (let sx = 0; sx < scale; sx++) {
                                for (let sy = 0; sy < scale; sy++) {
                                    this.setPixel(currentX + (col * scale) + sx, y + (row * scale) + sy, true);
                                }
                            }
                        }
                    }
                }
                currentX += (6 * scale);
            }
        }
    }

    public drawRect(x: number, y: number, w: number, h: number, fill: boolean = false): void {
        if (fill) {
            for (let i = x; i < x + w; i++)
                for (let j = y; j < y + h; j++) this.setPixel(i, j, true);
        } else {
            for (let i = x; i < x + w; i++) { this.setPixel(i, y, true); this.setPixel(i, y + h - 1, true); }
            for (let j = y; j < y + h; j++) { this.setPixel(x, j, true); this.setPixel(x + w - 1, j, true); }
        }
    }

    public async close(): Promise<void> {
        await this.writeCommand(SH1107Display.Commands.DISPLAY_OFF);
    }
}

export default SH1107Display;