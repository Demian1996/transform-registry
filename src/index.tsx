import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Button, Upload, Input, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import './index.less';
import { RcFile } from 'antd/lib/upload';

const REGEX_MAP = {
  npmorg: { reg: /https:\/\/registry\.npmjs\.org\//gm, desc: 'https://registry.npmjs.org/' },
  yarnorg: { reg: /https:\/\/registry\.yarnpkg\.com\//gm, desc: 'https://registry.yarnpkg.com/'},
  taobao: { reg: /https:\/\/registry\.npm\.taobao\.org\//gm, desc: 'https://registry.npm.taobao.org/' },
  mirror: { reg: /https:\/\/registry\.npmmirror\.com\//gm, desc: 'https://registry.npmmirror.com/' },
};

function App() {
  const [file, setFile] = useState<RcFile | null>(null);
  const [lockfileContent, setLockfileContent] = useState('');
  const [matchMap, setMatchMap] = useState<Record<string, any[]>>({});
  const [mode, setMode] = useState<'npm' | 'yarn'>('yarn');
  const [targetRegistry, setTargetRegistry] = useState('');
  const props: UploadProps = {
    name: 'file',
    multiple: false,
    onRemove: () => {
      setFile(null);
    },
    beforeUpload: (file) => {
      setFile(file);
      return false;
    },
    fileList: file ? [file] : [],
  };

  const onInput = useCallback((e: any) => {
    setTargetRegistry(e.target.value);
  }, []);

  const onDownload = useCallback(() => {
    let content = lockfileContent;
    Object.keys(REGEX_MAP).forEach((key) => {
      const regex = REGEX_MAP[key as keyof typeof REGEX_MAP].reg;
      content = content.replace(regex, () => {
        if (targetRegistry.slice(-1) !== '/') {
          return targetRegistry + '/';
        }
        return targetRegistry;
      });
    });
    const blob = new Blob([content], { type: 'text/plain' });

    const a = document.createElement('a');
    a.download = mode === 'yarn' ? 'yarn.lock' : 'package-lock.json';
    a.href = URL.createObjectURL(blob);
    a.click();

    URL.revokeObjectURL(a.href);
  }, [file, lockfileContent, mode, targetRegistry]);

  useEffect(() => {
    if (file) {
      setMode(file.name.includes('.lock') ? 'yarn' : 'npm');
      const reader = new FileReader();
      reader.onload = function (e: any) {
        setLockfileContent(e.target.result);
      };
      reader.readAsText(file, 'utf-8');
    }
  }, [file]);

  useEffect(() => {
    // 根据mode设定正则匹配
    let map: any = {};
    Object.keys(REGEX_MAP).forEach((key) => {
      map[key] = lockfileContent.match(REGEX_MAP[key as keyof typeof REGEX_MAP].reg) || [];
    });
    setMatchMap(map);
  }, [lockfileContent, mode]);

  return (
    <div styleName="content">
      <Space direction="vertical">
        <Upload {...props}>
          <Button icon={<UploadOutlined />}>上传lock文件</Button>
        </Upload>
        {file
          ? Object.keys(matchMap).map((type) =>
              matchMap[type]?.length > 0
                ? `🙄：文件中有 ${matchMap[type].length} 个 ${REGEX_MAP[type as keyof typeof REGEX_MAP].desc}`
                : `😵：没发现有 ${REGEX_MAP[type as keyof typeof REGEX_MAP].desc} ，自查一下提交文件`
            )
          : null}
        {Object.values(matchMap).some((arr) => arr.length > 0) && (
          <>
            输入内网registry：<Input value={targetRegistry} onChange={onInput}></Input>
            <Button onClick={onDownload}>下载新文件</Button>
          </>
        )}
      </Space>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));

// 模块热更新
if (module.hot) {
  module.hot.accept();
}
