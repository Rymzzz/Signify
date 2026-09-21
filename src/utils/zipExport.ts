import JSZip from 'jszip';
import { JAVA_DESKTOP_FILES } from '../data/javaDesktopCode';
import { JAVA_MOBILE_FILES } from '../data/javaMobileCode';
import { PYTHON_CONVERTER_SCRIPT } from '../data/conversionGuide';

export async function exportDesktopJavaZip(): Promise<void> {
  const zip = new JSZip();
  const rootFolder = zip.folder('signify-asl-desktop');

  if (rootFolder) {
    JAVA_DESKTOP_FILES.forEach(file => {
      rootFolder.file(file.path, file.content);
    });
    // Add conversion script
    rootFolder.file('scripts/convert_model.py', PYTHON_CONVERTER_SCRIPT);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, 'signify-asl-desktop-java.zip');
}

export async function exportMobileAndroidZip(): Promise<void> {
  const zip = new JSZip();
  const rootFolder = zip.folder('signify-asl-mobile-android');

  if (rootFolder) {
    JAVA_MOBILE_FILES.forEach(file => {
      rootFolder.file(file.path, file.content);
    });
    rootFolder.file('scripts/convert_model.py', PYTHON_CONVERTER_SCRIPT);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, 'signify-asl-mobile-android.zip');
}

export async function exportAllProjectsZip(): Promise<void> {
  const zip = new JSZip();
  const desktopFolder = zip.folder('desktop-java-javafx');
  const mobileFolder = zip.folder('mobile-java-android');

  if (desktopFolder) {
    JAVA_DESKTOP_FILES.forEach(file => {
      desktopFolder.file(file.path, file.content);
    });
  }

  if (mobileFolder) {
    JAVA_MOBILE_FILES.forEach(file => {
      mobileFolder.file(file.path, file.content);
    });
  }

  zip.file('convert_model.py', PYTHON_CONVERTER_SCRIPT);
  zip.file('GROUP_9_PROJECT_CONTEXT.md', `# Signify: A Real-Time Gesture Recognition Application for ASL Learners
## Group #9 Project Conceptualization
- **SDG 4**: Quality Education (Target 4.5: Ensure equal access to education and foster inclusive learning environments for persons with disabilities)
- **Members**:
  - Christine Althea D. Barsatan
  - Francisco Alphonso M. Capio
  - Bryce Willand B. Tangalin
  - Raymond Augustine N. Venasquez

## Architecture Summary
Signify converts the Python ASL Recognition System (Muhib-Mehdi/ASL-Recognition-System) into complete Java Desktop (JavaFX + OpenCV + ONNX Runtime) and Java Mobile (Android Studio + CameraX + MediaPipe/TFLite) applications using an Event-Driven Architecture (EDA) to deliver instant visual feedback ("CORRECT!" or "TRY AGAIN").
`);

  const content = await zip.generateAsync({ type: 'blob' });
  downloadBlob(content, 'signify-complete-java-codebase.zip');
}

export const downloadJavaProjectsZip = exportAllProjectsZip;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
