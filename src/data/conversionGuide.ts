export interface PipelineComparison {
  component: string;
  pythonOriginal: string;
  javaDesktop: string;
  javaMobile: string;
  notes: string;
}

export const PIPELINE_COMPARISONS: PipelineComparison[] = [
  {
    component: 'Camera Stream Capture',
    pythonOriginal: 'OpenCV VideoCapture (cv2.VideoCapture(0)) in a while True loop',
    javaDesktop: 'org.opencv.videoio.VideoCapture inside ScheduledExecutorService (30 FPS)',
    javaMobile: 'AndroidX CameraX ImageAnalysis running on background Executor',
    notes: 'Eliminates UI freezing by moving frame decoding off the main render thread.'
  },
  {
    component: 'Hand Landmark Tracking',
    pythonOriginal: 'mp.solutions.hands.Hands(min_detection_confidence=0.7)',
    javaDesktop: 'Microsoft ONNX Runtime (com.microsoft.onnxruntime) or OpenCV DNN',
    javaMobile: 'Google MediaPipe Tasks Vision for Android (HandLandmarker)',
    notes: 'Extracts the exact same 21 (x, y, z) 3D joint landmarks.'
  },
  {
    component: 'Feature Normalization',
    pythonOriginal: 'Translate relative to wrist (index 0), divide 42 coords by max absolute value',
    javaDesktop: 'OnnxHandClassifier.preProcessLandmarks(landmarks) returning float[42]',
    javaMobile: 'SignifyMobileClassifier.normalizeCoordinates(landmarks) returning float[42]',
    notes: 'Guarantees scale and position invariance regardless of hand distance from camera.'
  },
  {
    component: 'Neural Classifier Inference',
    pythonOriginal: 'tf.lite.Interpreter / Keras Sequential MLP (42 inputs -> 26 outputs)',
    javaDesktop: 'OrtSession.run() using asl_classifier.onnx with OnnxTensor float buffer',
    javaMobile: 'org.tensorflow.lite.Interpreter using asl_classifier.tflite',
    notes: 'Zero latency loss: Java ONNX Runtime and Android TFLite run natively with hardware acceleration.'
  },
  {
    component: 'User Interface & Feedback',
    pythonOriginal: 'cv2.imshow() with cv2.putText() overlaid on raw frame',
    javaDesktop: 'JavaFX 21 FXML + Canvas overlay + CSS animations + Web Audio chimes',
    javaMobile: 'Material 3 XML Layout + OverlayView + Haptic Vibration pulse',
    notes: 'Provides rich educational feedback ("CORRECT!" / "TRY AGAIN" with anatomical advice).'
  },
  {
    component: 'Software Architecture',
    pythonOriginal: 'Monolithic procedural script (tightly coupled frame loop)',
    javaDesktop: 'Event-Driven Architecture (Publisher: CameraCapture -> EventBus -> Subscribers)',
    javaMobile: 'Event-Driven Architecture (CameraX Analyzer -> GestureEventManager -> UI/Haptic)',
    notes: 'Meets Group #9 SDG 4 requirement: instant event dispatch without polling delay.'
  }
];

export const PYTHON_CONVERTER_SCRIPT = `"""
Signify Model Converter Pipeline (Muhib-Mehdi ASL -> ONNX & TFLite)
Group #9: Signify ASL Gesture Recognition Application (SDG 4.5)

Converts the trained Python ASL keypoint neural network into:
1. 'asl_classifier.onnx'  -> Used by Java Desktop (JavaFX + ONNX Runtime)
2. 'asl_classifier.tflite' -> Used by Java Mobile (Android Studio + TFLite)
"""

import os
import tensorflow as tf
import tf2onnx

def convert_model(h5_model_path="model/keypoint_classifier/keypoint_classifier.h5"):
    print(f"[*] Loading Python Keras model from: {h5_model_path}")
    model = tf.keras.models.load_model(h5_model_path)
    model.summary()

    # 1. Export to ONNX for Java Desktop
    print("[*] Converting model to ONNX for Java Desktop (JavaFX)...")
    spec = (tf.TensorSpec((None, 42), tf.float32, name="input"),)
    output_onnx_path = "asl_classifier.onnx"
    
    model_proto, _ = tf2onnx.convert.from_keras(
        model, 
        input_signature=spec, 
        opset=13, 
        output_path=output_onnx_path
    )
    print(f"[+] Successfully exported: {output_onnx_path}")

    # 2. Export to TFLite for Java Mobile (Android)
    print("[*] Converting model to TFLite for Java Mobile (Android Studio)...")
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()

    output_tflite_path = "asl_classifier.tflite"
    with open(output_tflite_path, "wb") as f:
        f.write(tflite_model)
    print(f"[+] Successfully exported: {output_tflite_path}")

    print("\\n[SUCCESS] Both Java models are compiled and ready for deployment!")

if __name__ == "__main__":
    convert_model()
`;

export const MATHEMATICAL_PROOF_COMPARISON = {
  python: `def pre_process_landmark(landmark_list):
    temp_landmark_list = copy.deepcopy(landmark_list)
    base_x, base_y = 0, 0
    for index, landmark_point in enumerate(temp_landmark_list):
        if index == 0:
            base_x, base_y = landmark_point[0], landmark_point[1]
        temp_landmark_list[index][0] = temp_landmark_list[index][0] - base_x
        temp_landmark_list[index][1] = temp_landmark_list[index][1] - base_y

    temp_landmark_list = list(itertools.chain.from_iterable(temp_landmark_list))
    max_value = max(list(map(abs, temp_landmark_list)))

    def normalize_(n):
        return n / max_value

    temp_landmark_list = list(map(normalize_, temp_landmark_list))
    return temp_landmark_list`,

  java: `public static float[] preProcessLandmarks(List<Point> landmarks) {
    if (landmarks == null || landmarks.size() < 21) return new float[42];

    double baseX = landmarks.get(0).x;
    double baseY = landmarks.get(0).y;

    float[] tempCoordinates = new float[42];
    double maxAbsVal = 0.0;

    for (int i = 0; i < 21; i++) {
        Point p = landmarks.get(i);
        float relX = (float) (p.x - baseX);
        float relY = (float) (p.y - baseY);

        tempCoordinates[i * 2] = relX;
        tempCoordinates[i * 2 + 1] = relY;

        if (Math.abs(relX) > maxAbsVal) maxAbsVal = Math.abs(relX);
        if (Math.abs(relY) > maxAbsVal) maxAbsVal = Math.abs(relY);
    }

    if (maxAbsVal > 1e-6) {
        for (int i = 0; i < 42; i++) {
            tempCoordinates[i] /= (float) maxAbsVal;
        }
    }
    return tempCoordinates;
}`
};
