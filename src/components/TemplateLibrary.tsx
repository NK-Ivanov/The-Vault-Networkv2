import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, FileJson, ArrowRight } from 'lucide-react';
import { N8N_TEMPLATES, getTemplateFileUrl, getComplexityBadgeColor, type N8NTemplate } from '@/lib/n8n-templates';
import { useToast } from '@/hooks/use-toast';

const TemplateLibrary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const { toast } = useToast();

  const filteredTemplates = useMemo(() => {
    let templates = [...N8N_TEMPLATES];

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      templates = templates.filter(t => t.setupComplexity === selectedDifficulty);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.businessUseCase.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }

    // Sort by difficulty: Low first, then Medium, then High
    const difficultyOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
    templates.sort((a, b) => {
      const orderA = difficultyOrder[a.setupComplexity] || 999;
      const orderB = difficultyOrder[b.setupComplexity] || 999;
      return orderA - orderB;
    });

    return templates;
  }, [searchQuery, selectedDifficulty]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(6);
  }, [searchQuery, selectedDifficulty]);

  const displayedTemplates = filteredTemplates.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTemplates.length;

  const handleShowMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  const handleDownload = async (template: N8NTemplate) => {
    if (!template.fileName) {
      toast({
        title: "Template unavailable",
        description: "This template file is not available yet.",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileUrl = getTemplateFileUrl(template.fileName);
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch template file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = template.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Template downloaded!",
        description: `${template.name} has been downloaded successfully.`,
      });
    } catch (error: any) {
      console.error('Error downloading template:', error);
      toast({
        title: "Download failed",
        description: error.message || "Failed to download template. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates by name, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No templates found matching your search criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedTemplates.map((template) => (
              <Card key={template.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg leading-tight">{template.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`${getComplexityBadgeColor(template.setupComplexity)} shrink-0`}
                    >
                      {template.setupComplexity}
                    </Badge>
                  </div>
                  <Badge variant="secondary" className="text-xs w-fit">
                    {template.category}
                  </Badge>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  <div className="space-y-2 flex-1">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Use Case:</p>
                      <p className="text-sm">{template.businessUseCase}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Description:</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{template.description}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownload(template)}
                    disabled={!template.fileName}
                    className="w-full mt-auto"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {template.fileName ? 'Download Template' : 'Coming Soon'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Show More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleShowMore}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                Show More
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
        <span>
          Showing {displayedTemplates.length} of {filteredTemplates.length} templates
          {filteredTemplates.length !== N8N_TEMPLATES.length && ` (${N8N_TEMPLATES.length} total)`}
        </span>
        <span className="flex items-center gap-1">
          <FileJson className="w-4 h-4" />
          Foundation Pack
        </span>
      </div>
    </div>
  );
};

export default TemplateLibrary;

