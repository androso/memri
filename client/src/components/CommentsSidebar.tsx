import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { Comment } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Send, Trash2, Edit, MoreVertical, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { HandDrawn } from "@/components/ui/hand-drawn";
import { getImageUrl } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface CommentWithUser extends Comment {
  user: {
    id: number;
    username: string;
    displayName: string;
    profilePicture: string | null;
  } | null;
}

interface CommentsSidebarProps {
  photoId: string;
  photoTitle?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isDesktopSidebar?: boolean;
}

export function CommentsSidebar({ photoId, photoTitle, isOpen, onOpenChange, isDesktopSidebar }: CommentsSidebarProps) {
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<{ id: number; content: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments
  const {
    data: comments = [],
    isLoading: commentsLoading,
    error: commentsError
  } = useQuery<CommentWithUser[]>({
    queryKey: [API_ENDPOINTS.photoComments(photoId)],
    enabled: (isOpen && !!photoId) || (isDesktopSidebar && !!photoId),
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("POST", API_ENDPOINTS.photoComments(photoId), { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.photoComments(photoId)] });
      setNewComment("");
      setIsSubmitting(false);
      toast({
        title: "Comment added",
        description: "Your comment has been added to this photo.",
      });
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast({
        title: "Failed to add comment",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => 
      apiRequest("PUT", API_ENDPOINTS.comment(id), { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.photoComments(photoId)] });
      setEditingComment(null);
      toast({
        title: "Comment updated",
        description: "Your comment has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update comment",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => 
      apiRequest("DELETE", API_ENDPOINTS.comment(commentId), {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.photoComments(photoId)] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete comment",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    createCommentMutation.mutate(newComment.trim());
  };

  const handleUpdateComment = () => {
    if (!editingComment || !editingComment.content.trim()) return;
    
    updateCommentMutation.mutate({
      id: editingComment.id,
      content: editingComment.content.trim()
    });
  };

  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation.mutate(commentId);
  };

  const formatCommentDate = (dateString: string | null) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2 border-b">
        <h2 className="flex items-center gap-2 font-quicksand font-bold text-lg text-[#9C7178]">
          <MessageCircle className="h-5 w-5 text-[#9C7178]" />
          Comments
        </h2>
      </div>
      
      {/* Comments list */}
      <ScrollArea className="flex-1 p-4">
        {commentsLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                  <div className="h-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {commentsError && (
          <div className="text-center py-8">
            <p className="text-gray-500">Failed to load comments</p>
          </div>
        )}
        
        {!commentsLoading && !commentsError && comments.length === 0 && (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No comments yet</p>
            <p className="text-sm text-gray-400">Be the first to share your thoughts about this memory!</p>
          </div>
        )}
        
        {!commentsLoading && !commentsError && comments.length > 0 && (
          <div className="space-y-4">
            {comments.map((comment) => (
              <HandDrawn key={comment.id} className="bg-white p-3">
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage 
                      src={getImageUrl(comment.user?.profilePicture) || undefined} 
                      alt={comment.user?.displayName || "User"} 
                    />
                    <AvatarFallback className="bg-[#E6B89C] text-white text-xs">
                      {comment.user?.displayName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-[#4A4A4A]">
                        {comment.user?.displayName || "Unknown User"}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">
                          {formatCommentDate(comment.createdAt ? comment.createdAt.toString() : null)}
                        </span>
                        
                        {comment.user && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingComment({ id: comment.id, content: comment.content })}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteComment(comment.id)}
                                className="flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    
                    {editingComment && editingComment.id === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingComment.content}
                          onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                          className="min-h-[60px] text-sm"
                          placeholder="Update your comment..."
                        />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={handleUpdateComment}
                            disabled={updateCommentMutation.isPending}
                            className="bg-[#88B9B0] hover:bg-opacity-90 text-white"
                          >
                            {updateCommentMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setEditingComment(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[#4A4A4A] whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              </HandDrawn>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <Separator />
      
      {/* New comment form */}
      <div className="p-4">
        <HandDrawn className="bg-[#F4F1EA] p-3">
          <div className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this memory..."
              className="min-h-[80px] border-[#88B9B0] focus:border-[#9C7178] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {newComment.length}/500 characters
              </span>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting || newComment.length > 500}
                className="bg-[#88B9B0] hover:bg-opacity-90 text-white font-quicksand"
                size="sm"
              >
                {isSubmitting ? (
                  "Posting..."
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        </HandDrawn>
      </div>
    </div>
  );

  // Desktop sidebar mode
  if (isDesktopSidebar) {
    return (
      <HandDrawn className="bg-white h-[calc(100vh-12rem)] overflow-hidden shadow-lg">
        {content}
      </HandDrawn>
    );
  }

  if (onOpenChange) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[400px] sm:w-[440px] p-0">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments {comments.length > 0 && `(${comments.length})`}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[440px] p-0">
        {content}
      </SheetContent>
    </Sheet>
  );
} 