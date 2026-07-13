require "language/node"

class Nocommit < Formula
  desc "AI-powered CLI that writes your git commit messages using Google Gemini"
  homepage "https://github.com/asimar007/no-commit"
  url "https://registry.npmjs.org/nocommit/-/nocommit-1.0.0.tgz"
  sha256 "d154ee8cbe8e40d87dd064f13c62a5fb80cd0988547571f651456304c3f52b80"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/nocommit --version")
  end
end
