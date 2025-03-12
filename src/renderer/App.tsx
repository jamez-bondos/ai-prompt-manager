import React, { useState, useEffect } from 'react';
import { Layout, theme, Tooltip, Input, Button, Card, Space, message, Divider, Upload, Typography } from 'antd';
import { BulbOutlined, SettingOutlined, MoonOutlined, ImportOutlined, ExportOutlined, UploadOutlined } from '@ant-design/icons';
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
    };
  }
}

// 自定义标题栏组件
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

// 侧边栏图标组件
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
  const [activeView, setActiveView] = useState<'prompt' | 'theme' | 'settings'>('prompt');
  const { token } = theme.useToken();
  const [messageApi, contextHolder] = message.useMessage();

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

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

  // 导入模板处理函数
  const handleImportTemplates = async () => {
    try {
      const result = await window.api.importTemplates();
      if (result.success) {
        messageApi.success(`成功导入了 ${result.count || 0} 个提示词`);
        await loadTemplates(); // 重新加载所有提示词
      } else {
        messageApi.error(`导入失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      messageApi.error(`导入过程中出错: ${error}`);
      console.error('Import error:', error);
    }
  };

  // 导出模板处理函数
  const handleExportTemplates = async () => {
    try {
      const result = await window.api.exportTemplates();
      if (result.success) {
        messageApi.success(`成功导出了 ${result.count || 0} 个提示词到 ${result.path || '文件'}`);
      } else {
        messageApi.error(`导出失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      messageApi.error(`导出过程中出错: ${error}`);
      console.error('Export error:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredTemplates = templates.filter(template => 
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    template.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 渲染当前活动视图的内容
  const renderActiveView = () => {
    switch (activeView) {
      case 'prompt':
        return (
          <div id="prompt-view-container" style={{ display: 'flex', height: '100%' }}>
            {/* 模板列表区域 */}
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
            
            {/* 编辑器区域 */}
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
      case 'theme':
        return (
          <div style={{ 
            padding: '24px', 
            color: 'white',
          }}>
            <h2>主题设置</h2>
            <p>这里将来会显示主题设置选项</p>
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
            <Typography.Title level={2}>应用设置</Typography.Title>
            
            <Card title="导入与导出" style={{ marginTop: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Typography.Text strong>导入提示词</Typography.Text>
                  <Typography.Paragraph type="secondary">
                    选择一个JSON文件导入提示词，文件格式必须是包含title/content/link字段的数组
                  </Typography.Paragraph>
                  <Button 
                    icon={<ImportOutlined />} 
                    onClick={handleImportTemplates}
                  >
                    导入提示词
                  </Button>
                </div>
                
                <Divider />
                
                <div>
                  <Typography.Text strong>导出提示词</Typography.Text>
                  <Typography.Paragraph type="secondary">
                    将所有提示词导出为JSON文件
                  </Typography.Paragraph>
                  <Button 
                    icon={<ExportOutlined />} 
                    onClick={handleExportTemplates}
                  >
                    导出提示词
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
        {/* 图标侧边栏 */}
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
        
        {/* 主内容区域 */}
        <div id="main-content-wrapper" style={{ 
          marginLeft: '48px', 
          height: 'calc(100vh - 38px)',
          width: 'calc(100% - 48px)',
          position: 'relative',
        }}>
          {/* 主内容 */}
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