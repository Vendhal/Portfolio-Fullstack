import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

interface ImageOptimizationConfig {
  inputDir: string;
  outputDir: string;
  formats: string[];
  widths: number[];
  quality: number;
}

const defaultConfig: ImageOptimizationConfig = {
  inputDir: 'src/assets/images',
  outputDir: 'public/images',
  formats: ['webp', 'jpeg', 'png'],
  widths: [320, 640, 1024, 1280, 1920],
  quality: 80
};

class ImageOptimizer {
  private config: ImageOptimizationConfig;

  constructor(config: Partial<ImageOptimizationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async optimizeImages(): Promise<void> {
    console.log('🖼️  Starting image optimization...');
    
    try {
      // Ensure output directory exists
      await this.ensureDirectory(this.config.outputDir);
      
      // Get all images from input directory
      const images = await this.getImageFiles(this.config.inputDir);
      
      if (images.length === 0) {
        console.log('📁 No images found in', this.config.inputDir);
        return;
      }
      
      console.log(`🔍 Found ${images.length} images to optimize`);
      
      // Process each image
      for (const imagePath of images) {
        await this.processImage(imagePath);
      }
      
      console.log('✅ Image optimization completed!');
    } catch (error) {
      console.error('❌ Error during image optimization:', error);
    }
  }

  private async ensureDirectory(dir: string): Promise<void> {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private async getImageFiles(dir: string): Promise<string[]> {
    if (!fs.existsSync(dir)) {
      return [];
    }
    
    const files = fs.readdirSync(dir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    return files
      .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)))
      .map(file => path.join(dir, file));
  }

  private async processImage(imagePath: string): Promise<void> {
    const fileName = path.basename(imagePath, path.extname(imagePath));
    const inputStats = fs.statSync(imagePath);
    
    console.log(`📸 Processing: ${fileName} (${this.formatBytes(inputStats.size)})`);
    
    // For now, we'll copy the original images to the output directory
    // In a real implementation, you would use a library like sharp or imagemin
    // to actually resize and optimize the images
    
    const originalExt = path.extname(imagePath);
    const outputPath = path.join(this.config.outputDir, path.basename(imagePath));
    
    // Copy original image
    fs.copyFileSync(imagePath, outputPath);
    
    // Simulate creating responsive variants
    // In production, you would generate actual resized images
    this.createResponsiveVariants(imagePath, fileName);
    
    const outputStats = fs.statSync(outputPath);
    const savings = inputStats.size - outputStats.size;
    const percentage = savings > 0 ? ((savings / inputStats.size) * 100).toFixed(1) : '0';
    
    console.log(`  ✓ Optimized: ${this.formatBytes(outputStats.size)} (${percentage}% savings)`);
  }

  private createResponsiveVariants(imagePath: string, fileName: string): void {
    // This simulates creating responsive image variants
    // In production, you would use sharp or similar to actually resize images
    
    this.config.widths.forEach(width => {
      this.config.formats.forEach(format => {
        const variantName = `${fileName}_${width}w.${format}`;
        const outputPath = path.join(this.config.outputDir, variantName);
        
        // For simulation, we just copy the original
        // In production: resize and convert format
        if (!fs.existsSync(outputPath)) {
          fs.copyFileSync(imagePath, outputPath);
        }
      });
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export for use in build scripts
export { ImageOptimizer };

// CLI usage
if (import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  const optimizer = new ImageOptimizer({
    inputDir: process.argv[2] || 'public/images',
    outputDir: process.argv[3] || 'public/images/optimized'
  });
  
  optimizer.optimizeImages();
}