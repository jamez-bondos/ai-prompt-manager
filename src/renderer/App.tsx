import React, { useState, useEffect } from 'react';
import { Layout, theme, Tooltip, Input, Button, Card, Space, message, Divider, Upload, Typography, Select } from 'antd';
import { BulbOutlined, SettingOutlined, MoonOutlined, ImportOutlined, ExportOutlined, UploadOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

import TemplateList from './components/TemplateList';
import TemplateEditor from './components/TemplateEditor';
import { Template } from './types';

const { Content, Sider } = Layout;

// Define the API interface
declare global {
  interface Window {
    api: {
      saveTemplate: (template: Template) => Promise<any>;
      getTemplates: () => Promise<any>;
      deleteTemplate: (templateId: string) => Promise<any>;
      exportTemplates: () => Promise<any>;
      importTemplates: () => Promise<any>;
      sendChatMessage: (message: string, model: string) => Promise<any>;
      saveSettings: (settings: any) => Promise<any>;
      getSettings: () => Promise<any>;
    };
  }
}

// Custom title bar component
const TitleBar: React.FC = () => {
  return (
    <div
      style={{
        height: '38px',
        backgroundColor: '#222023',
        '-webkit-app-region': 'drag',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '13px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      } as React.CSSProperties}
    >
      AI Prompt Manager
    </div>
  );
};

// Sidebar icon component
const SidebarIcon: React.FC<{
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  tooltip?: string;
}> = ({ icon, isActive, onClick, tooltip }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const iconElement = (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        color: isActive || isHovered ? '#1890ff' : '#8c8c8c',
        cursor: 'pointer',
        transition: 'all 0.3s',
      }}
    >
      {icon}
    </div>
  );
  
  return tooltip ? (
    <Tooltip title={tooltip} placement="right">
      {iconElement}
    </Tooltip>
  ) : iconElement;
};

const App: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'prompt' | 'chat' | 'theme' | 'settings'>('prompt');
  const { token } = theme.useToken();
  const [messageApi, contextHolder] = message.useMessage();
  const [chatMessages, setChatMessages] = useState<Array<{content: string, sender: 'user' | 'ai'}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [settings, setSettings] = useState<any>({});

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
    loadSettings();

    hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));
    hljs.registerLanguage('typescript', require('highlight.js/lib/languages/typescript'));
    hljs.registerLanguage('python', require('highlight.js/lib/languages/python'));
    hljs.registerLanguage('html', require('highlight.js/lib/languages/xml'));
    hljs.registerLanguage('css', require('highlight.js/lib/languages/css'));
    hljs.registerLanguage('json', require('highlight.js/lib/languages/json'));

    marked.setOptions({
      breaks: true,  // Support GitHub-style line breaks
      gfm: true,     // Enable GitHub Flavored Markdown
      headerIds: false,
      mangle: false,
      highlight: function(code, lang) {
        try {
          if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
          return hljs.highlightAuto(code).value;
        } catch (error) {
          console.error('Highlight error:', error);
          return code; // Fallback handling
        }
      },
    });
  }, []);

  const loadSettings = async () => {
    try {
      const result = await window.api.getSettings();
      if (result.success) {
        setSettings(result.settings || {});
      } else {
        console.error('Error loading settings:', result.error);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async (newSettings: any) => {
    try {
      const result = await window.api.saveSettings(newSettings);
      if (result.success) {
        messageApi.success('Settings saved successfully');
        setSettings(newSettings);
      } else {
        messageApi.error(`Failed to save settings: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      messageApi.error(`Error saving settings: ${error}`);
      console.error('Save settings error:', error);
    }
  };

  const renderContent = (content: string) => {
    try {
      // Convert Markdown to HTML and sanitize content
      const rawHtml = marked(content);
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['class'], // Ensure class attributes are preserved
      });
      return (
        <div 
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: cleanHtml }}
        />
      );
    } catch (error) {
      console.log('renderContent error', error);
      return <div style={{ color: 'white', whiteSpace: 'pre-wrap' }}>{content}</div>;
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await window.api.getTemplates();
      if (result.success) {
        setTemplates(result.templates || []);
      } else {
        console.error('Error loading templates:', result.error);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (template: Template) => {
    setLoading(true);
    try {
      const result = await window.api.saveTemplate(template);
      if (result.success) {
        await loadTemplates();
        setSelectedTemplate(result.template);
      } else {
        console.error('Error saving template:', result.error);
      }
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setLoading(true);
    try {
      const result = await window.api.deleteTemplate(templateId);
      if (result.success) {
        await loadTemplates();
        if (selectedTemplate?.id === templateId) {
          setSelectedTemplate(null);
        }
      } else {
        console.error('Error deleting template:', result.error);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportTemplates = async () => {
    try {
      const result = await window.api.importTemplates();
      if (result.success) {
        messageApi.success(`Successfully imported ${result.count || 0} prompts`);
        await loadTemplates(); // Reload all prompts
      } else {
        messageApi.error(`Import failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      messageApi.error(`Error during import: ${error}`);
      console.error('Import error:', error);
    }
  };

  const handleExportTemplates = async () => {
    try {
      const result = await window.api.exportTemplates();
      if (result.success) {
        messageApi.success(`Successfully exported ${result.count || 0} prompts to ${result.path || 'file'}`);
      } else {
        messageApi.error(`Export failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      messageApi.error(`Error during export: ${error}`);
      console.error('Export error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    // Add user message to chat history
    const newMessages = [...chatMessages, {content: currentMessage, sender: 'user' as const}];
    setChatMessages(newMessages);
    
    const aiResponse = await window.api.sendChatMessage(currentMessage, selectedModel);
    console.log('aiResponse', aiResponse);
    setChatMessages([...newMessages, {content: aiResponse.message, sender: 'ai' as const}]);
    
    // // For now, just add a placeholder response
    // setTimeout(() => {
    //   setChatMessages([...newMessages, {content: 'This is a placeholder AI response.', sender: 'ai'}]);
    // }, 500);
    
    // Clear input
    setCurrentMessage('');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredTemplates = templates.filter(template => 
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    template.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render content for current active view
  const renderActiveView = () => {
    switch (activeView) {
      case 'prompt':
        return (
          <div id="prompt-view-container" style={{ display: 'flex', height: '100%' }}>
            {/* Template list area */}
            <div id="template-list-container" style={{ 
              width: '300px', 
              height: '100%', 
              borderRight: `1px solid ${token.colorBorderSecondary}`,
              backgroundColor: '#151515',
              overflow: 'auto',
            }}>
              <TemplateList 
                templates={filteredTemplates}
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
                onAddTemplate={() => setSelectedTemplate({ id: '', title: '', content: '' })}
                onDeleteTemplate={handleDeleteTemplate}
                onSearch={handleSearch}
                searchQuery={searchQuery}
                loading={loading}
              />
            </div>
            
            {/* Editor area */}
            <div id="template-editor-container" style={{ 
              flex: 1, 
              height: '100%', 
              width: 'calc(100% - 300px)',
              backgroundColor: '#151515',
              padding: '24px 16px 0',
              overflow: 'auto',
            }}>
              <TemplateEditor 
                template={selectedTemplate}
                onSaveTemplate={handleSaveTemplate}
              />
            </div>
          </div>
        );
        case 'chat':
          return (
            <div id="chat-view-container" style={{ display: 'flex', height: '100%' }}>
              {/* Chat settings panel */}
              <div id="chat-settings-container" style={{ 
                width: '300px', 
                height: '100%', 
                borderRight: `1px solid ${token.colorBorderSecondary}`,
                backgroundColor: '#151515',
                overflow: 'auto',
                padding: '16px',
              }}>
                <Typography.Title level={4} style={{ color: 'white', marginBottom: '24px' }}>Chat Settings</Typography.Title>
                
                <div style={{ marginBottom: '16px' }}>
                  <Typography.Text strong style={{ color: 'white', display: 'block', marginBottom: '8px' }}>Models</Typography.Text>
                  <Select
                    style={{ width: '100%' }}
                    value={selectedModel}
                    onChange={setSelectedModel}
                    options={[
                      { value: 'openai/gpt-4o-mini', label: 'gpt-4o-mini' },
                      { value: 'google/gemini-flash-1.5', label: 'gemini-flash-1.5' },
                      { value: 'anthropic/claude-3.5-sonnet', label: 'claude-3.5-sonnet' },
                    ]}
                  />
                </div>
              </div>
              
              {/* Chat area */}
              <div id="chat-area-container" style={{ 
                flex: 1, 
                height: '100%', 
                width: 'calc(100% - 300px)',
                backgroundColor: '#151515',
                display: 'flex',
                flexDirection: 'column',
                fontSize: '16px',
              }}>
                {/* Chat history */}
                <div id="chat-history" style={{ 
                  flex: 1, 
                  overflow: 'auto',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  {chatMessages.map((message, index) => (
                    <Card 
                    key={index}
                    style={{ 
                      backgroundColor: message.sender === 'user' ? '#28B561' : '#363636',
                      borderRadius: '8px',
                      alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      width: message.sender === 'user' ? '20%' : '60%',
                      maxWidth: '80%',
                      padding: '0',
                      textAlign: message.sender === 'user' ? 'right' : 'left',
                      paddingLeft: message.sender === 'user' ? '0' : '8px',
                      paddingRight: message.sender === 'user' ? '8px' : '0',
                    }}
                    styles={{ 
                      body: { padding: '4px' }
                    }}
                  >
                    {renderContent(message.content)}
                  </Card>
                  ))}
                </div>
                
                {/* Chat input */}
                <div id="chat-input" style={{ 
                  padding: '16px', 
                  borderTop: `1px solid ${token.colorBorderSecondary}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ 
                    position: 'relative',
                    width: '100%'
                  }}>
                    <Input.TextArea 
                      value={currentMessage}
                      onChange={e => setCurrentMessage(e.target.value)}
                      placeholder="Type your message here..."
                      autoSize={{ minRows: 2, maxRows: 10 }}
                      onPressEnter={(e) => {
                        if (!e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                          setCurrentMessage('');
                        }
                      }}
                      style={{ 
                        width: '100%', 
                        fontSize: '16px',
                        paddingRight: '48px'
                      }}
                    />
                    <Button 
                      type="primary" 
                      icon={<SendOutlined />} 
                      onClick={() => {
                        handleSendMessage();
                        setCurrentMessage('');
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 1
                      }}
                    />
                  </div>
                  <Typography.Text type="secondary" style={{ alignSelf: 'flex-end', fontSize: '12px' }}>
                    Use Shift + Enter for new line
                  </Typography.Text>
                </div>
              </div>
            </div>
          );
      case 'theme':
        return (
          <div style={{ 
            padding: '24px', 
            color: 'white',
          }}>
            <h2>Theme Settings</h2>
            <p>Theme settings options will be displayed here</p>
          </div>
        );
      case 'settings':
        return (
          <div style={{ 
            padding: '24px', 
            color: 'white',
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            {contextHolder}
            <Typography.Title level={2}>Application Settings</Typography.Title>
            
            <Card title="Import & Export" style={{ marginTop: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Typography.Text strong>Import Prompts</Typography.Text>
                  <Typography.Paragraph type="secondary">
                    Select a JSON file to import prompts. The file must contain an array with title/content/link fields
                  </Typography.Paragraph>
                  <Button 
                    icon={<ImportOutlined />} 
                    onClick={handleImportTemplates}
                  >
                    Import Prompts
                  </Button>
                </div>
                
                <Divider />
                
                <div>
                  <Typography.Text strong>Export Prompts</Typography.Text>
                  <Typography.Paragraph type="secondary">
                    Export all prompts to a JSON file
                  </Typography.Paragraph>
                  <Button 
                    icon={<ExportOutlined />} 
                    onClick={handleExportTemplates}
                  >
                    Export Prompts
                  </Button>
                </div>
              </Space>
            </Card>

            <Card title="API Settings" style={{ marginTop: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Typography.Text strong>Openrouter API Key</Typography.Text>
                  <Input.Password
                    placeholder="Enter API Key" 
                    value={settings?.openrouter_apikey || ''}
                    onChange={e => setSettings({...settings, openrouter_apikey: e.target.value})}
                    style={{ marginTop: '8px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <Button type="primary" onClick={() => handleSaveSettings(settings)}>
                    Save Settings
                  </Button>
                </div>
              </Space>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#151515' }}>
      <TitleBar />
      <Layout style={{ marginTop: '38px', minHeight: 'calc(100vh - 38px)', backgroundColor: '#151515' }}>
        {/* Icon sidebar */}
        <Sider
          width={48}
          theme="dark"
          style={{
            position: 'fixed',
            left: 0,
            top: '38px',
            bottom: 0,
            backgroundColor: '#222023',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 1001,
          }}
        >
          <div>
            <SidebarIcon 
              icon={<BulbOutlined />} 
              isActive={activeView === 'prompt'} 
              tooltip="Prompt" 
              onClick={() => setActiveView('prompt')}
            />
            <SidebarIcon 
              icon={<MessageOutlined />} 
              isActive={activeView === 'chat'} 
              tooltip="Chat" 
              onClick={() => setActiveView('chat')}
            />
          </div>
          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <SidebarIcon 
              icon={<MoonOutlined />} 
              isActive={activeView === 'theme'} 
              tooltip="Theme" 
              onClick={() => setActiveView('theme')}
            />
            <SidebarIcon 
              icon={<SettingOutlined />} 
              isActive={activeView === 'settings'} 
              tooltip="Settings" 
              onClick={() => setActiveView('settings')}
            />
          </div>
        </Sider>
        
        {/* Main content area */}
        <div id="main-content-wrapper" style={{ 
          marginLeft: '48px', 
          height: 'calc(100vh - 38px)',
          width: 'calc(100% - 48px)',
          position: 'relative',
        }}>
          {/* Main content */}
          <div id="main-content" style={{ 
            height: '100%',
            backgroundColor: '#151515',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {renderActiveView()}
          </div>
        </div>
      </Layout>
    </Layout>
  );
};

export default App; 