import React from 'react';
import { List, Input, Button, Spin, Empty, Popconfirm, Typography, Space } from 'antd';
import { PlusOutlined, SearchOutlined, DeleteOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Template } from '../types';

const { Search } = Input;
const { Text } = Typography;

interface TemplateListProps {
  templates: Template[];
  selectedTemplate: Template | null;
  onSelectTemplate: (template: Template) => void;
  onAddTemplate: () => void;
  onDeleteTemplate: (templateId: string) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  loading: boolean;
}

const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  selectedTemplate,
  onSelectTemplate,
  onAddTemplate,
  onDeleteTemplate,
  onSearch,
  searchQuery,
  loading,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 0' }}>
        <Search
          placeholder="Search templates"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          onSearch={onSearch}
          style={{ width: '100%' }}
          prefix={<SearchOutlined />}
          allowClear
        />
      </div>
      
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
            <Spin />
          </div>
        ) : templates.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchQuery ? "No templates match your search" : "No templates yet"
            }
            style={{ margin: '24px 0' }}
          />
        ) : (
          <List
            dataSource={templates}
            renderItem={(template) => (
              <List.Item
                className={`template-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                style={{ padding: '8px 16px', cursor: 'pointer' }}
                onClick={() => onSelectTemplate(template)}
                actions={[
                  <Popconfirm
                    key="delete"
                    title="Delete this template?"
                    description="This action cannot be undone."
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      onDeleteTemplate(template.id);
                    }}
                    okText="Delete"
                    cancelText="Cancel"
                    placement="left"
                  >
                    <DeleteOutlined
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#ff4d4f' }}
                    />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={<Text strong>{template.title}</Text>}
                  description={
                    <Text type="secondary" ellipsis>
                      {template.content.substring(0, 100)}
                      {template.content.length > 100 ? '...' : ''}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
      
      <div style={{ padding: '8px 16px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAddTemplate}
          style={{ width: '100%' }}
        >
          Add Template
        </Button>
      </div>
    </div>
  );
};

export default TemplateList;