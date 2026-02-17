import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, Trash2, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { uploadImage, deleteFile, getPublicUrl } from '@/utils/directFileUpload';

interface UploadedImage {
  id: string;
  path: string;
  url: string;
  fileName: string;
  uploadedAt: Date;
  size: number;
}

export default function ImageManagement() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      try {
        const result = await uploadImage(file);

        if (result.success) {
          const newImage: UploadedImage = {
            id: `${Date.now()}-${Math.random()}`,
            path: result.path || '',
            url: result.url || getPublicUrl(result.path || ''),
            fileName: file.name,
            uploadedAt: new Date(),
            size: file.size,
          };

          setImages((prev) => [newImage, ...prev]);
          successCount++;
        } else {
          failureCount++;
          toast.error(`Failed to upload ${file.name}`, {
            description: result.error || 'Unknown error',
          });
        }
      } catch (error) {
        failureCount++;
        console.error('Upload error:', error);
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} image(s)`);
    }
    if (failureCount > 0) {
      toast.error(`Failed to upload ${failureCount} image(s)`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      handleFileSelect(imageFiles);
    } else {
      toast.error('Please drop image files only');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
    // Reset input
    e.target.value = '';
  };

  const handleDelete = async (image: UploadedImage) => {
    setDeleteConfirmId(null);
    setDeleting(image.id);

    try {
      const result = await deleteFile(image.path);

      if (result.success) {
        setImages((prev) => prev.filter((img) => img.id !== image.id));
        toast.success('Image deleted successfully');
      } else {
        toast.error('Failed to delete image', {
          description: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    } finally {
      setDeleting(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Image Management</h1>
        <p className="text-gray-600">Upload and manage product images</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Images
          </CardTitle>
          <CardDescription>
            Drag and drop images or click to browse. Supported formats: JPEG, PNG, GIF, WebP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary/50'
            }`}
          >
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleInputChange}
              disabled={uploading}
              className="hidden"
              id="image-input"
            />
            <label htmlFor="image-input" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <ImageIcon className="h-10 w-10 text-gray-400" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {uploading ? 'Uploading...' : 'Drag and drop images here'}
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to select files from your computer
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Upload Constraints */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold">Upload requirements:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Maximum file size: 5MB per image</li>
                <li>Supported formats: JPEG, PNG, GIF, WebP</li>
                <li>Multiple files can be uploaded at once</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images Gallery */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Uploaded Images ({images.length})
            </CardTitle>
            <CardDescription>
              View and manage your uploaded images
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition"
                >
                  {/* Image Preview */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.fileName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22system-ui%22 font-size=%2214%22 fill=%22%239ca3af%22%3EImage failed to load%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>

                  {/* Image Info */}
                  <div className="p-3 border-t">
                    <p className="font-semibold text-sm truncate text-gray-900 mb-1">
                      {image.fileName}
                    </p>
                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      <p>Size: {formatFileSize(image.size)}</p>
                      <p>Uploaded: {formatDate(image.uploadedAt)}</p>
                    </div>

                    {/* Copy URL & Delete Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(image.url);
                          toast.success('Image URL copied to clipboard');
                        }}
                        className="flex-1"
                      >
                        Copy URL
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirmId(image.id)}
                        disabled={deleting === image.id}
                        className="w-10 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Delete Confirmation Dialog */}
                  <AlertDialog
                    open={deleteConfirmId === image.id}
                    onOpenChange={(open) => {
                      if (!open) setDeleteConfirmId(null);
                    }}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Image</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{image.fileName}"? This action cannot
                          be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(image)}
                          disabled={deleting === image.id}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting === image.id ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No images yet</h3>
            <p className="text-gray-600 text-center">
              Start by uploading your first image using the upload area above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
