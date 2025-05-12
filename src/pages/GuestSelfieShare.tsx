import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { fileToDataUrl, createThumbnail } from "@/lib/file-service";
import { guestService } from "@/lib/guest-service";
import { supabaseService } from "@/lib/supabase-service";
import { Camera, Download, ArrowLeft, RefreshCw, Share, User } from "lucide-react";
import * as faceapi from 'face-api.js';
import { Guest, Photo } from "@/types";

const GuestSelfieShare = () => {
  const { guestId, albumId } = useParams<{ guestId: string, albumId: string }>();
  const navigate = useNavigate();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [guestPhotos, setGuestPhotos] = useState<Photo[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTakingSelfie, setIsTakingSelfie] = useState(false);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [searchReady, setSearchReady] = useState(false);
  const [searching, setSearching] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const fetchGuestData = async () => {
      if (!guestId || !albumId) {
        toast({
          title: "Error",
          description: "Missing guest or album information",
          variant: "destructive"
        });
        return;
      }

      try {
        // Load guest information
        const guestResponse = await guestService.getGuestById(guestId);
        
        if (guestResponse.error || !guestResponse.data) {
          toast({
            title: "Error",
            description: "Could not find guest information",
            variant: "destructive"
          });
          return;
        }

        setGuest(guestResponse.data);
        
        // If guest has a photoUrl, load their photos
        if (guestResponse.data.photoUrl) {
          await loadGuestPhotos(guestResponse.data);
        }
      } catch (error) {
        console.error("Error fetching guest data:", error);
        toast({
          title: "Error",
          description: "Something went wrong loading guest information",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGuestData();
  }, [albumId, guestId, toast]);

  useEffect(() => {
    // Load face-api models - make sure version matches the imported library
    const loadModels = async () => {
      try {
        // Use a version that matches our package
        // This needs to match the version in package.json (0.20.0)
        const MODEL_URL = '/models';
        
        toast({
          title: "Loading face detection models",
          description: "Please wait while we prepare face recognition...",
        });
        
        // Load models one by one with proper error handling
        try {
          await faceapi.nets.ssdMobilenetv1.load(MODEL_URL);
          console.log("SSD MobileNet model loaded");
        } catch (error) {
          console.error("Failed to load SSD MobileNet model:", error);
          throw new Error("Failed to load face detection model");
        }
        
        try {
          await faceapi.nets.faceLandmark68Net.load(MODEL_URL);
          console.log("Face Landmark model loaded");
        } catch (error) {
          console.error("Failed to load Face Landmark model:", error);
          throw new Error("Failed to load face landmarks model");
        }
        
        try {
          await faceapi.nets.faceRecognitionNet.load(MODEL_URL);
          console.log("Face Recognition model loaded");
        } catch (error) {
          console.error("Failed to load Face Recognition model:", error);
          throw new Error("Failed to load face recognition model");
        }
        
        setModelsLoaded(true);
        toast({
          title: "Ready",
          description: "Face detection is ready to use",
        });
      } catch (error) {
        console.error("Error loading face-api models:", error);
        setModelsError(error instanceof Error ? error.message : "Failed to load face recognition models");
        toast({
          title: "Face Detection Error",
          description: "Could not load face recognition models. Basic photo matching will be used instead.",
          variant: "destructive"
        });
      }
    };
    
    loadModels();
    
    // Ensure we clean up any models if component unmounts
    return () => {
      // No specific cleanup needed for models
    };
  }, [toast]);

  const loadGuestPhotos = async (currentGuest: Guest) => {
    try {
      const photos = await supabaseService.getApprovedPhotosByAlbumId(albumId!);
      
      // Filter photos that include this guest
      const guestPhotos = photos.filter(photo => 
        photo.metadata?.guestIds?.includes(currentGuest.id) ||
        photo.metadata?.assignment === currentGuest.guestName
      );
      
      setGuestPhotos(guestPhotos);
    } catch (error) {
      console.error("Error loading guest photos:", error);
      toast({
        title: "Error",
        description: "Could not load photos",
        variant: "destructive"
      });
    }
  };

  const startCamera = async () => {
    try {
      setIsTakingSelfie(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast({
        title: "Camera Error",
        description: "Could not access your camera. Please check permissions.",
        variant: "destructive"
      });
      setIsTakingSelfie(false);
    }
  };

  const takeSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const context = canvas.getContext("2d");
    if (context) {
      context.drawImage(video, 0, 0);
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/jpeg");
      setSelfieDataUrl(dataUrl);
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setIsTakingSelfie(false);
      setSearchReady(true);
      
      toast({
        title: "Selfie captured",
        description: "Now you can search for photos with you in them",
      });
    }
  };

  const retakeSelfie = () => {
    setSelfieDataUrl(null);
    setSearchReady(false);
    startCamera();
  };

  const createImageFromUrl = async (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Handle potential CORS issues
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  };

  const findMatchingPhotos = async () => {
    if (!selfieDataUrl || !guest || !albumId) return;
    
    setSearching(true);
    toast({
      title: "Finding your photos",
      description: "Looking for photos you appear in...",
    });
    
    try {
      // First, update the guest's photo if they don't have one yet
      if (!guest.photoUrl) {
        // Upload selfie to storage
        const file = await fetch(selfieDataUrl).then(res => res.blob());
        const selfieFile = new File([file], `guest_${guest.id}_selfie.jpg`, { type: 'image/jpeg' });
        
        // Upload to storage
        const uploadResult = await supabaseService.uploadImageToStorage(albumId, selfieFile);
        
        if (uploadResult) {
          // Update guest record with photo URL
          await guestService.updateGuestPhoto(guest.id, uploadResult.url);
          
          // Update local guest object
          setGuest({
            ...guest,
            photoUrl: uploadResult.url
          });
        }
      }
      
      // If face-api models are loaded, perform face recognition
      if (modelsLoaded) {
        // fetch all approved photos
        const allPhotos = await supabaseService.getApprovedPhotosByAlbumId(albumId);
        
        // compute descriptor for selfie
        try {
          const selfieImg = await createImageFromUrl(selfieDataUrl);
          const selfieDetections = await faceapi.detectSingleFace(selfieImg)
            .withFaceLandmarks()
            .withFaceDescriptor();
          
          if (!selfieDetections) {
            toast({ 
              title: "No face detected", 
              description: "We couldn't detect a face in your selfie. Try taking another one with good lighting.", 
              variant: "destructive" 
            });
            setGuestPhotos([]);
          } else {
            const selfieDescriptor = selfieDetections.descriptor;
            const matches: Photo[] = [];
            let processedCount = 0;
            
            // Show a loading status
            toast({
              title: "Scanning photos",
              description: `Processing ${allPhotos.length} photos...`
            });
            
            // Use a more lenient threshold (0.8 instead of 0.6)
            const FACE_MATCH_THRESHOLD = 0.75;
            
            // Process photos in batches to avoid UI freezing
            for (const photo of allPhotos) {
              try {
                const imgEl = await createImageFromUrl(photo.url);
                const detections = await faceapi.detectAllFaces(imgEl)
                  .withFaceLandmarks()
                  .withFaceDescriptors();
                
                processedCount++;
                
                if (detections.length > 0) {
                  // Check all faces in the photo
                  for (const detection of detections) {
                    const dist = faceapi.euclideanDistance(selfieDescriptor, detection.descriptor);
                    if (dist < FACE_MATCH_THRESHOLD) {
                      matches.push(photo);
                      break; // One match in the photo is enough
                    }
                  }
                }
                
                // Update progress every 5 photos
                if (processedCount % 5 === 0) {
                  toast({
                    title: "Scanning photos",
                    description: `Processed ${processedCount} of ${allPhotos.length} photos...`
                  });
                }
              } catch (error) {
                console.error(`Error processing photo ${photo.id}:`, error);
                continue; // Skip this photo but continue with others
              }
            }
            
            setGuestPhotos(matches);
            toast({ 
              title: matches.length ? "Photos found!" : "No photos found", 
              description: matches.length ? `We found ${matches.length} photos with you in them.` : "We couldn't find any photos with you in them yet." 
            });
          }
        } catch (error) {
          console.error("Error in face detection:", error);
          toast({
            title: "Face Detection Error",
            description: "An error occurred during face detection. Falling back to basic matching.",
            variant: "destructive"
          });
          
          // Fallback: filter by assignment metadata
          await loadGuestPhotos(guest);
        }
      } else {
        // Fallback: filter by assignment metadata
        await loadGuestPhotos(guest);
      }
    } catch (error) {
      console.error("Error searching for photos:", error);
      toast({
        title: "Error",
        description: "Something went wrong while searching for your photos",
        variant: "destructive"
      });
      
      // Fallback to metadata-based matching
      await loadGuestPhotos(guest);
    } finally {
      setSearching(false);
      setIsCapturing(false);
    }
  };

  const downloadPhoto = async (photo: Photo) => {
    try {
      // Create an anchor element and set the href to the photo URL
      const link = document.createElement('a');
      link.href = photo.url;
      link.setAttribute('download', `photo_${photo.id}.jpg`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: "Your photo download has started",
      });
    } catch (error) {
      console.error("Error downloading photo:", error);
      toast({
        title: "Download failed",
        description: "Could not download the photo",
        variant: "destructive"
      });
    }
  };

  const handleBackToAlbum = () => {
    navigate(`/album/${albumId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <User className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <h2 className="text-xl font-bold">Guest Not Found</h2>
              <p className="text-gray-500">We couldn't find the guest information you're looking for.</p>
            </div>
            
            <Button
              className="w-full"
              onClick={handleBackToAlbum}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Album
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCapturing) {
    return (
      <div className="container mx-auto p-4 flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-md overflow-hidden">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-center mb-4">
              Take a Selfie
            </h2>
            
            <p className="text-gray-500 text-center mb-6">
              We'll use this to find photos you appear in
            </p>
            
            <div className="relative rounded-lg overflow-hidden bg-gray-100 mb-6">
              {isTakingSelfie ? (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-auto"
                />
              ) : selfieDataUrl ? (
                <img 
                  src={selfieDataUrl} 
                  alt="Your selfie" 
                  className="w-full h-auto"
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-100">
                  <Camera className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            {modelsError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm">
                <p className="font-medium text-yellow-800">Face detection limited</p>
                <p className="text-yellow-700">{modelsError}</p>
                <p className="text-yellow-700 mt-1">We'll use basic photo matching instead.</p>
              </div>
            )}
            
            <div className="flex gap-3">
              {!isTakingSelfie && !selfieDataUrl && (
                <Button 
                  className="flex-1" 
                  onClick={startCamera}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Access Camera
                </Button>
              )}
              
              {isTakingSelfie && (
                <Button 
                  className="flex-1 bg-blue-500 hover:bg-blue-600" 
                  onClick={takeSelfie}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Selfie
                </Button>
              )}
              
              {selfieDataUrl && !searching && (
                <>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={retakeSelfie}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retake
                  </Button>
                  
                  <Button 
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    onClick={findMatchingPhotos}
                    disabled={!searchReady || searching}
                  >
                    {searching ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Share className="mr-2 h-4 w-4" />
                        Find My Photos
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
            
            <Button
              variant="ghost"
              className="mt-4 w-full text-gray-500"
              onClick={() => setIsCapturing(false)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleBackToAlbum}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Album
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Hi, {guest.guestName}!
            </h1>
            <p className="text-gray-500">
              Here are photos you appear in
            </p>
          </div>
          
          {!guest.photoUrl && (
            <Button
              onClick={() => setIsCapturing(true)}
            >
              <Camera className="mr-2 h-4 w-4" />
              Take Selfie to Find Photos
            </Button>
          )}
        </div>
      </div>
      
      {guest.photoUrl && guestPhotos.length === 0 && (
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-gray-600">
              We haven't found any photos with you in them yet.
            </p>
            <p className="text-sm text-gray-500">
              Check back later as more photos are added!
            </p>
          </CardContent>
        </Card>
      )}
      
      {guestPhotos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guestPhotos.map(photo => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="aspect-square relative overflow-hidden">
                <img 
                  src={photo.url} 
                  alt="Event photo"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 right-0 p-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="bg-white/80 hover:bg-white rounded-full"
                    onClick={() => downloadPhoto(photo)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {(!guest.photoUrl || guestPhotos.length === 0) && (
        <div className="mt-8 text-center">
          <Button
            onClick={() => setIsCapturing(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            <Camera className="mr-2 h-5 w-5" />
            Take a Selfie to Find Your Photos
          </Button>
        </div>
      )}
    </div>
  );
};

export default GuestSelfieShare;
